// 2.0 引入 superagent 包，用于服务器发送http请求
const request = require('superagent')
// 3.0 导入cheerio, 把字符串解析成HTML
const cheerio = require('cheerio');
// 4.0 导入模板引擎
const template = require('art-template')
// 导入 path模块处理路径
const path = require('path');
// 5.0 导入  发送邮件的包
"use strict";
const nodemailer = require("nodemailer");
// 6.0 导入 定时任务模块
var schedule = require('node-schedule');

// 1.0 计算爱人认识的天数
function getDayData() {

    return new Promise((resolve, reject) => {
        // 现在的时间
        const today = new Date();
        //认识的时间 2-19-03-01
        const meet = new Date('2019-03-01');
        // 计算相识到今天的天数
        const count = Math.ceil((today - meet) / 1000 / 60 / 60 / 24);
        // 今天日期格式化
        const format = today.getFullYear() + ' / ' + (today.getMonth() + 1) + ' / '+ today.getDate();
        const dayData = {
            count,
            format
        }
        // console.log(dayData);
        resolve(dayData);
    })


    

}

getDayData()

// 2.0.1 请求墨迹天气获取数据
function getMojiData(){
    return new Promise((resolve, reject)=>{
        request.get('https://tianqi.moji.com/weather/china/jiangsu/suzhou').end((err,res)=>{
            if(err) return console.log("数据请求失败，请检查路径");
            // console.log(res.text);
            // 把字符串解析成HTML, 并可用jQuery核心选择器获取内容
            const $ = cheerio.load(res.text);
            // 图标
            const icon = $('.wea_weather span img').attr('src');
            // 天气
            const weather = $('.wea_weather b').text();
            // 温度
            const temperature = $('.wea_weather em').text();
            // 提示
            const tips = $('.wea_tips em').text()
    
            const mojiData = {
                icon,           
                weather,
                temperature,
                tips
            }
            // console.log(mojiData);
            resolve(mojiData);
        })
    })
   
}

// getMojiData();

// 3.1 请求 One 页面抓取数据
function getOneData() {
    return new Promise((resolve, reject)=>{
        request.get('http://wufazhuce.com/').end((err, res) => {
            if(err) return console.log('请求失败');
    
            //把返回值中的页面解析成 HTML
            const $ = cheerio.load(res.text)
            // 抓取 one 的图片
            const img = $('.carousel-inner>.item>img, .carousel-inner>.item>a>img').eq(0).attr('src')
            // 抓取 one 的文本
            const text = $('.fp-one .fp-one-cita-wrapper .fp-one-cita a').eq(0).text();
    
            const oneData = {
                img,
                text
            }
            // console.log(oneData)
            resolve(oneData);
        });
    })
    
}
// getOneData();

// 4.0 通过模板引擎替换HTML的数据
async function renderTemplate() {
    // 获取日期
    const dayData = await getDayData();
    // 获取墨迹天气数据
    const mojiData = await getMojiData();
    // 获取One的数据
    const oneData = await getOneData();
    // console.log(dayData)
    // console.log(mojiData)
    // console.log(oneData)
    // 2.所有数据都获取成功的时候，才进行模板引擎数据的替换
   return new Promise((resolve, reject)=>{
    const html = template(path.join(__dirname, './love.html'), {
        dayData,
        mojiData,
        oneData
    });
    // console.log(html);
    resolve(html);
   })

}
// renderTemplate();

// 5. 发送邮件
async function sendNodeMail() {
    // HTML 页面内容,通过 await 等等模板引擎渲染完毕后，再往下执行代码
    const html = await renderTemplate();
    console.log(html);
    // 使用默认SMTP传输，创建可重用邮箱对象
    let transporter = nodemailer.createTransport({
        // host: "smtp.163.com",
        host: "smtp.126.com",
        port: 465,
        secure: true, //开启加密协议，需要使用465端口号
        auth: {
            // user: "gzqd201802@163.com", //用户名
            user: "******@126.com", //注意，此处必须填写用户名邮箱地址
            // pass: "1234qwer" //客户端授权密码
            pass: "ceshi12345" //客户端授权密码
        }
    });

    //设置电子邮箱数据
    let mailOptions = {
        from: '"帅气的小哥哥" <dfsq12345@126.com', //发件人邮箱
        to: "gorokox527@riv3r.net", //收件人列表
        subject: "爱的邮件", //标题
        html: html // html 内容
    };

    transporter.sendMail(mailOptions, (error, info = {}) => {
        if (error) {
            console.log(error);
            sendNodeMail(); //再次发送
        }
        console.log("邮件发送成功", info.messageId);
        console.log("静静等下一次发送");
    })
}

// sendNodeMail();
// 6. 定时每天23时36分发送邮件给女（男）朋友

// 6.1 创建定时任务
var j = schedule.scheduleJob('7 38 23 * * *', function() {
    sendNodeMail();
    // console.log('The answer to life, the universe, and everything1');
    console.log("定时任务的邮件发送成功");
})

