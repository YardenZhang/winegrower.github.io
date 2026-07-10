const fs = require('fs');
const Database = require('/home/yarden/.hermes/node/lib/node_modules/@waline/vercel/node_modules/better-sqlite3');

const DB_PATH = '/home/yarden/Documents/Web/myblog/waline-data/waline.sqlite';
const DUMP_PATH = '/home/yarden/Documents/Web/Data/winegrower/text/winegrower_2026-07-10.sql';

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS wl_Comment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comment TEXT, link TEXT, mail TEXT, nick TEXT,
    pid INTEGER DEFAULT 0, rid INTEGER DEFAULT 0, ua TEXT,
    url TEXT, ip TEXT, insertedAt DATETIME, user_id INTEGER DEFAULT 0,
    status TEXT DEFAULT 'approved', like INTEGER DEFAULT 0,
    sticky INTEGER DEFAULT 0, browser TEXT, os TEXT,
    addr TEXT, avatar TEXT, orig TEXT, type TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS wl_Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    display_name TEXT, email TEXT, url TEXT, password TEXT,
    type TEXT DEFAULT 'guest', label TEXT, avatar TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS wl_Counter (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT UNIQUE, time INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_comment_url ON wl_Comment(url);
  CREATE INDEX IF NOT EXISTS idx_comment_status ON wl_Comment(status);
  CREATE INDEX IF NOT EXISTS idx_comment_insertedAt ON wl_Comment(insertedAt);
  CREATE INDEX IF NOT EXISTS idx_users_email ON wl_Users(email);
`);

// Admin user
if (!db.prepare("SELECT id FROM wl_Users WHERE email=?").get('wineshe@qq.com')) {
  db.prepare("INSERT INTO wl_Users (display_name,email,url,password,type) VALUES (?,?,?,?,?)")
    .run('Yarden Zhang','wineshe@qq.com','https://winegrower.cn','','administrator');
  console.log('Created admin');
}

const dump = fs.readFileSync(DUMP_PATH, 'utf-8');

// Parse slug map from contents
const slugMap = {};
const cStart = dump.indexOf('Dumping data for table `typecho_contents`');
const cEnd = dump.indexOf('Dumping data for table `typecho_fields`');
if (cStart > 0) {
  const section = dump.substring(cStart, cEnd > cStart ? cEnd : cStart + 400000);
  const vi = section.indexOf('VALUES');
  const ei = section.indexOf('ENABLE KEYS');
  if (vi > 0 && ei > vi) {
    const content = section.substring(vi + 6, ei).trim();
    // Remove trailing semicolon
    const rows = extractRows(content);
    for (const raw of rows) {
      const fields = splitFields(raw);
      if (fields.length >= 3) {
        const cid = parseInt(fields[0]) || 0;
        const slug = fields[2].replace(/^'|'$/g, '');
        if (cid && slug) slugMap[cid] = slug;
      }
    }
  }
}
console.log('Loaded', Object.keys(slugMap).length, 'post slugs');

function extractRows(content) {
  const rows = [];
  let depth = 0, start = -1;
  for (let i = 0; i < content.length; i++) {
    if (content[i] === "'") {
      i++;
      while (i < content.length) {
        if (content[i] === '\\') { i += 2; continue; }
        if (content[i] === "'") break;
        i++;
      }
      continue;
    }
    if (content[i] === '(') { depth++; if (depth === 1) start = i; }
    else if (content[i] === ')') { depth--; if (depth === 0 && start >= 0) {
      rows.push(content.substring(start + 1, i));
      start = -1;
    }}
  }
  return rows;
}

function splitFields(s) {
  const result = [];
  let cur = '', inStr = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\' && inStr) { cur += c; if (i+1 < s.length) { i++; cur += s[i]; } continue; }
    if (c === "'") { cur += c; inStr = !inStr; continue; }
    if (c === ',' && !inStr) { result.push(cur); cur = ''; continue; }
    cur += c;
  }
  if (cur) result.push(cur);
  return result;
}

function unescape(s) {
  if (!s) return '';
  if (s.startsWith("'") && s.endsWith("'")) s = s.slice(1, -1);
  return s.replace(/\\'/g, "'").replace(/\\"/g, '"')
          .replace(/\\r\\n/g, '\n').replace(/\\r/g, '\n').replace(/\\n/g, '\n');
}

// Parse comments
const cmtStart = dump.indexOf('Dumping data for table `typecho_comments`');
const cmtEnd = dump.indexOf('Dumping data for table `typecho_contents`');
if (cmtStart < 0) { console.log('No comments section!'); db.close(); process.exit(0); }

const section = dump.substring(cmtStart, cmtEnd > cmtStart ? cmtEnd : cmtStart + 400000);
const vi = section.indexOf('VALUES');
const ei = section.indexOf('ENABLE KEYS');
if (vi < 0 || ei < 0) { console.log('No VALUES found!'); db.close(); process.exit(0); }

const content = section.substring(vi + 6, ei).trim();
const rows = extractRows(content);
console.log('Found', rows.length, 'comment rows');

// coid,cid,created,author,authorId,ownerId,mail,url,ip,agent,text,type,status,parent
const stmt = db.prepare(
  "INSERT INTO wl_Comment (comment,link,mail,nick,pid,rid,ua,url,ip,insertedAt,status,user_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)"
);
const cntStmt = db.prepare("INSERT OR IGNORE INTO wl_Counter (url) VALUES (?)");

let ins = 0, pb = 0, sk = 0, err = 0;
for (const raw of rows) {
  try {
    const f = splitFields(raw);
    if (f.length < 14) { err++; continue; }

    const cid = parseInt(f[1]) || 0;
    const created = parseInt(f[2]) || 0;
    const author = unescape(f[3]);
    const authorId = parseInt(f[4]) || 0;
    let mail = unescape(f[6]) || null;
    let link = unescape(f[7]) || null;
    let ip = unescape(f[8]) || null;
    let uaStr = unescape(f[9]) || null;
    let text = unescape(f[10]);
    let type = unescape(f[11]);
    let status = unescape(f[12]);
    let parent = parseInt(f[13]) || 0;

    if (type !== 'comment') { pb++; continue; }
    if (status === 'spam') { sk++; continue; }
    if (!text || !author) { sk++; continue; }

    const slug = slugMap[cid] || String(cid);
    const url = '/posts/' + slug + '/';
    const wStatus = status === 'approved' ? 'approved' : 'waiting';
    const isOwner = authorId > 0 || mail === 'wineshe@qq.com' || mail === 'wineshe@qq.com';
    const userId = isOwner ? 1 : 0;

    stmt.run(text, link, mail, author, parent, parent, uaStr, url, ip,
      created ? new Date(created * 1000).toISOString() : new Date().toISOString(),
      wStatus, userId);
    cntStmt.run(url);
    ins++;
  } catch(e) { err++; }
}

console.log(`Result: ${ins} imported, ${pb} pingbacks, ${sk} skipped, ${err} errors`);
db.close();
