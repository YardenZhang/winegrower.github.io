---
title: "typecho博客文章按发布时间倒序排列"
date: 2019-12-08
slug: "typecho-boke-wenzhang-paifa"
categories: ["心之所栖"]
tags: ["Typecho", "博客", "PHP", "教程"]
---

我有一个博客导航,是用Typecho程序驱动的,其中每个博客链接是TP中的每篇文章,因为博客导航是随着时间的推进在不断收录新的博客的,所以这样就会导致新收录的博客永远排在最早收录博客的前面。理论上而言,最早收录的博客相对于晚收录的博客具有优先曝光权,所以后收录的博客应该拍在后面。

但如何要实现这个功能呢？

1、每次发布文章都手动修改发布日期,让发布日期提前。但这个办法比较麻烦,且容易引起博客排列时间的混乱。

2、第二种是将typecho博客文章按发布时间倒序排列,这样就可以完美实现了。

<!--more-->

具体修改代码如下：

这个需要修改typecho源文件一个

`/var/Widget/Archive.php`中第1260行

```php
$select->order('table.contents.created', Typecho_Db::SORT_DESC)
```

修改成

```php
$select->order('table.contents.created', Typecho_Db::SORT_ASC)
```
