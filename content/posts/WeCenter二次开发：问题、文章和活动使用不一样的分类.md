---
title: "WeCenter二次开发：问题、文章和活动使用不一样的分类"
date: "2023-06-03"
slug: "wecenter-category-development"
categories: ["认知拓界"]
tags: ["WeCenter", "二次开发", "PHP", "开源系统"]
---

完成此项功能有三大部分：

1.管理-分类管理
2.文章、问题、活动列表
3.文章、问题、活动发表时分类选择。

## 第一部分：后台-分类管理

后台中 内容设置-》分类管理实现添加和修改分类的功能,修改功能不再改动,只改动添加功能。（即确定分类所属模块便不再修改。）

涉及文件：
- app/admin/category.php
- app/admin/ajax.php
- view/default/admin/category/list.tpl.htm

<!--more-->

首先,文件一需要获得分类列表。line37等修改为：(question 删除掉)

```php
TPL::assign('list', json_decode($this->model('system')->build_category_json(''), true));
TPL::assign('category_option', $this->model('system')->build_category_html('', 0, 0, null, false));
TPL::assign('target_category', $this->model('system')->build_category_html('', 0, null));
```

然后列表展示在list.tpl.htm中,修改添加分类的表单,添加分类所属的模块展示和选择。为列表添加"所属模块"列。

文件三line 19左右,改为：

```php
<th><?php _e('所属模块'); ?></th><!--添加了此行-->
<th><?php _e('分类标题'); ?></th>
<th><?php _e('排序'); ?></th>
<th><?php _e('操作'); ?></th>
```

对于的29行左右改为：

```php
<td><?php echo $val['type']; ?></td><!--此行为新增-->
<td> <a href="<?php echo $val['type']; ?>/category-<?php echo ($val['url_token']) ? $val['url_token'] : $val['id']; ?>"><?php echo $val['title']; ?></a> </td><!--此行被修改-->
```

改完以后,发现新加列为输出变量,修改model/system.php中用到的方法fetch_category()、build_category_html(),在两方法里的两个数组中添加'type' => $val['type']这个成员,改成了：

line 76

```php
$category_list[$val['id']] = array(
'id' => $val['id'],
'title' => $val['title'],
'type' => $val['type'],
'icon' => $val['icon'],
'description' => $val['description'],
 'parent_id' => $val['parent_id'],
'sort' => $val['sort'],
'url_token' => $val['url_token']
);
```

line 148

```php
$data[] = array(
'id' => $category_id,
'title' => $_prefix . $val['title'],
'type' => $val['type'],
'description' => $val['description'],
'sort' => $val['sort'],
'parent_id' => $val['parent_id'],
'url_token' => $val['url_token']
);
```

添加所属模块选择下拉框,大致在52行表单元素。调整了一下布局和添加了一个下拉框选择模块,修改之后表单代码：

```php
<form id="add_category_form" action="admin/ajax/save_category/" method="post" onsubmit="return false">
 <div class="form-group col-sm-4">
 <span class="col-sm-3 col-xs-12 mod-category-foot"><?php _e('分类标题'); ?></span>
 <div class="col-sm-6 col-xs-12">
 <input type="text" class="form-control" name="title" />
 </div>
 </div>

 <div class="form-group col-sm-4">
 <span class="col-sm-3 col-xs-12 mod-category-foot"><?php _e('所属模块') ?>:</span>
 <div class="col-sm-6 col-xs-12">
 <select name="category_type" class="form-control">
 <option value="question"><?php _e('问题'); ?></option>
 <option value="article"><?php _e('文章'); ?></option>
 <option value="project"><?php _e('活动'); ?></option>
 </select>
 </div>
 </div>

 <div class="form-group col-sm-4">
 <span class="col-sm-3 col-xs-12 mod-category-foot"><?php _e('父级分类') ?>:</span>
 <div class="col-sm-6 col-xs-12">
 <select name="parent_id" class="form-control">
 <option value="0"><?php _e('无'); ?></option>
 <?php echo $this->category_option; ?>
 </select>
 </div>
 </div>
 <div class="col-sm-1 col-xs-12">
 <a onclick="AWS.ajax_post($('#add_category_form'));" class="btn-primary btn"><?php _e('添加分类'); ?></a>
</div>
</form>
```

最后是ajax.php,line 397、398：

```php
$category_type=$_POST['category_type']?$_POST['category_type']:'question';
$category_id = $this->model('category')->add_category($category_type, $_POST['title'], $_POST['parent_id']);
```

## 第二部分：列表-分类导航

这一部分很简单,获得list,然后展示出来。

涉及文件：
1. app/article/main.php
2. app/question/main.php
3. app/project/main.php
4. view/default/article/square.tpl.htm
5. view/default/question/square.tpl.htm
6. view/default/project/square.tpl.htm

因未安装活动模块没再细作探究

文件一 line 218 ：

```php
if (TPL::is_output('block/content_nav.tpl.htm', 'question/square'))
{
TPL::assign('content_nav_menu', $this->model('system')->fetch_category('article'));
}
```

文件二 line 416

```php
if (TPL::is_output('block/content_nav.tpl.htm', 'question/square'))
{
TPL::assign('content_nav_menu', $this->model('system')->fetch_category('question'));
}
```

新建 views/default/block/content_nac.tpl.htm,内容为：

```php
<?php if ($this->content_nav_menu) { ?>
<div class="container category">
 <div class="row">
 <div class="col-sm-12">
 <?php if (get_setting('category_display_mode') == 'list') { ?>
 <ul class="list">
 <li<?php if (!$_GET['category']) { ?> class="active"<?php } ?>><a href="<?php echo $_GET['app']; ?>"><?php _e('全部'); ?></a></li>
 <?php foreach ($this->content_nav_menu as $key => $val) { ?>
 <?php if ($val['title']) { ?>
 <li<?php if (( $_GET['category'] AND ($val['id'] == $this->category_info['id'] OR $this->category_info['parent_id'] == $val['id'])) OR ($val['type'] == 'feature' AND $this->feature_info['id'] == $val['id'])) { ?> class="active"<?php } ?>>
 <a href="<?php echo $val['type']; ?>/category-<?php echo $val['url_token']; ?>"><?php echo $val['title']; ?></a>
 <?php if ($val['child'] && get_setting('nav_menu_show_child') == 'Y') { ?>
 <div class="aw-dropdown" role="menu" aria-labelledby="dropdownMenu">
 <span></span>
 <ul class="aw-dropdown-list">
 <?php foreach ($val['child'] AS $_key => $_val) { ?>
 <li><a href="<?php echo $_val['type']; ?>/category-<?php echo $_val['url_token']; ?>"<?php if ($_val['id'] == $this->category_info['id']) { ?> class="active"<?php } ?>><?php echo $_val['title']; ?></a></li>
 <?php } ?>
 </ul>
 </div>
 <?php } ?>
 </li>
 <?php } ?>
 <?php } ?>
 </ul>
 <?php } ?>
 </div>
</div>
</div>
<?php } ?>
```

## 第三部分：发表时不同分类的实现

很简单：

文件app/publish/main.php line168

app/project/main.php line88

把 `question` 分别修改为 `article` 和 `project`。

【至此完】
