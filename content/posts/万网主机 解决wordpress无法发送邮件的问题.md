---
title: "万网主机 解决wordpress无法发送邮件的问题"
date: 2015-07-31
slug: "2015年7月小记"
categories: ["认知拓界"]
tags: ["WordPress", "万网", "SMTP"]
---

我的WordPress主机是万网的,配置WP-Mail-SMTP时一直无法发送邮件,导致设置失败。经过多次询问度娘才找到了解决wordpress无法发送邮件的方法,在这里把这个wordpress技巧分享给大家。

万网的主机好像不支持mail函数,都需要通过 SMTP 来发送邮件,而且要开启 fsockopen 。但是 WordPress的SMTP发送方式为 steam_connect_client 而非fsockopen,下面来讲讲解决方法：

1.用FTP打开 /wp-include/class-smtpp.php ,最好是下载下来,搜索一下,查找到如下的代码：

```
$this->smtp_conn = @stream_socket_client(
$host . ":" . $port,
$errno,
$errstr,
$timeout,
STREAM_CLIENT_CONNECT,
$socket_context
);
```

（参考图片：解决wordpress无法发送邮件的问题|配置好WP-Mail-SMTP的前提）

2.注释掉上面的代码：

```
/**
需要注释的代码
*/
```

3.添加如下代码：

```
$this->smtp_conn = fsockopen($host, $port, $errno, $errstr);
```

然后使用 WP SMTP 或 WP MAIL SMTP 这类 SMTP 发送邮件的wordpress插件,配置好就可以了。

注意：由于这个方法是直接修改了 WordPress 的核心代码,一旦你升级了WordPress版本,就需要重新进行修改！
