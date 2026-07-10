---
title: "WeCenter程序站内及站外调用功能"
date: 2021-08-19
slug: "wecenter-neiwai-tiaoyong"
categories: ["认知拓界"]
tags: ["WeCenter", "WordPress", "Typecho", "站外调用"]
---

WeCenter可以实现一个很棒的知识社区,也是我目前最喜欢,最满足我要求的轻社区程序。但往往WC有些功能无法实现,需要其他程序（例如WordPress/ Typecho ）来做一个补充。

特别是WordPress可以给我们提供一个很漂亮的首页,但我们又想在WP的首页想调用WC最新动态,热门动态等内容。这个适合就涉及到站外调用功能。即使在WC程序内部我们也会遇到站内调用。经过我的各种尝试今天终于实现了这个功能,现将此功能分享如下：

1、下载插件：aws_external和aws_offical_external,上传至Wecenter程序的/plugins/
下载链接：[https://pan.baidu.com/s/1JzA4jaqW1wCM0KNS_utGeA](https://pan.baidu.com/s/1JzA4jaqW1wCM0KNS_utGeA) 提取码：v4v5

2、在Wordpress或Typecho 所需要呈现的呈现中添加调用代码：

2.1 调用最新问题：
```html
<div class="widget widget_archive">
<h3 class="title"><strong>最新问题</strong></h3>
<p><script type="text/javascript" charset="utf-8" src="http://www.wineshe.com/?/aws_external/js/last_questions/ul_class-gxwt__limit-10__day-30">
</script></p>
</div>
```

<!--more-->

2.2 调用热门话题：
```html
<div class="widget_tags_inner">
<h3 class="title"><strong>热门话题</strong></h3>
<p><script type="text/javascript" charset="utf-8" src="http://www.wineshe.com/?/aws_external/js/hot_topics/">
</script></p>
</div>
```

2.3 调用活跃用户：
```html
<div class="widget widget_tags_inner">
<h3 class="title"><strong>活跃用户</strong></h3>
<p><script type="text/javascript" charset="utf-8" src="http://www.wineshe.com/?/aws_external/js/hot_users/">
</script></p>
</div>
```

3、根据模板需要,修改调用内容格式。
例如,在WordPress中修改调用热门话题格式：/wp-content/themes/xiu/style.css
```css
.widget ul.widget_tags_inner{overflow: hidden;padding-top: 5px;font-size: 12px;margin-right: -6px;}
.widget_tags_inner li{float: left;width: 33.33333%;margin-top: 2px;}
.widget_tags_inner a{color: #444;display: block;margin-right: 6px;background-color: #fafafa;padding: 4px 8px;height: 28px;border-left: 1px solid #ededed;overflow: hidden;}
.widget_tags_inner a:hover{color: #fff;background-color: #44a9b2;border-left-color: #FED426;border-left-width: 4px;}
```
其他模板格式类似

目前亲测 Wordpress和 Typecho 两程序可以正常使用。
