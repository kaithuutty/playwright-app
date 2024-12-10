const express = require("express");
const multer = require("multer");
const { chromium } = require("playwright");

const app = express();
const upload = multer(); // 处理表单数据

// 提供 HTML 表单
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Website Screenshot</title>
    </head>
    <body>
        <h1>Generate a Screenshot</h1>
        <form action="/screenshot" method="post" enctype="multipart/form-data">
            <label for="url">Enter the URL:</label><br>
            <input type="text" id="url" name="url" placeholder="https://example.com" required><br><br>
            <button type="submit">Generate Screenshot</button>
        </form>
    </body>
    </html>
  `);
});

// 处理表单提交
app.post("/screenshot", upload.none(), async (req, res) => {
  const url = req.body.url;

  if (!url || !/^https?:\/\/.+$/.test(url)) {
    return res.status(400).send("Invalid URL. Please provide a valid http or https URL.");
  }

  try {
    // 使用 Playwright 截图
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url, { timeout: 60000 });
    const screenshotBuffer = await page.screenshot({ type: "png" });
    await browser.close();

    // 将截图以 base64 嵌入到 HTML 中
    const screenshotBase64 = screenshotBuffer.toString("base64");

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Screenshot Result</title>
      </head>
      <body>
          <h1>Screenshot of ${url}</h1>
          <img src="data:image/png;base64,${screenshotBase64}" alt="Screenshot" style="max-width:100%;height:auto;" />
          <br><br>
          <a href="/">Back to form</a>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Error generating screenshot:", error);
    res.status(500).send("Failed to generate screenshot. Please try again.");
  }
});

// 启动服务器
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
