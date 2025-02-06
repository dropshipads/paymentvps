const express = require("express");
const axios = require("axios");
const path = require("path"); // Thêm thư viện path
const app = express();
const port = 3000;

// Dữ liệu giá VPS
const prices = {
  "192.168.1.1": 500000,
  "192.168.1.2": 600000,
  "192.168.1.3": 700000,
};

// Cung cấp giá dựa trên IP
app.get("/getPrice/:ip", (req, res) => {
  const ip = req.params.ip;
  const price = prices[ip];
  if (price) {
    res.json({ price });
  } else {
    res.json({ price: null });
  }
});

// Gửi tin nhắn Telegram với các nút phản hồi
app.get("/sendTelegramMessage", (req, res) => {
  const { ip, price } = req.query;
  const message = `Thông báo thanh toán VPS\nIP: ${ip}\nGiá: ${price}`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "Đã nhận tiền", callback_data: `received_${ip}` },
        { text: "Chưa nhận tiền", callback_data: `not_received_${ip}` },
      ],
    ],
  };

  const telegramUrl = `https://api.telegram.org/bot7860571662:AAH8nOTFpadyMUAngFrzkjBVcit64-szFB4/sendMessage?chat_id=-1002310327706&text=${encodeURIComponent(
    message
  )}&reply_markup=${encodeURIComponent(JSON.stringify(keyboard))}`;

  axios
    .get(telegramUrl)
    .then((response) => {
      res.send("Tin nhắn đã được gửi");
    })
    .catch((error) => {
      console.error("Lỗi gửi tin nhắn:", error);
      res.send("Không thể gửi tin nhắn");
    });
});

// Lắng nghe phản hồi từ Telegram
app.post("/webhook", express.json(), (req, res) => {
  console.log("Received callback from Telegram:", req.body); // Debug log

  const callbackQuery = req.body.callback_query;
  if (callbackQuery) {
    console.log("Callback data:", callbackQuery); // Debug log

    const { data, message } = callbackQuery;
    const [status, ip] = data.split("_"); // Extract status (received or not_received) and IP

    // Tiếp tục xử lý phản hồi và gửi thông báo
    const responseMessage =
      status === "received"
        ? `Bạn đã xác nhận nhận tiền cho VPS với IP: ${ip}. Thanh toán thành công!`
        : `VPS với IP: ${ip} chưa nhận tiền. Vui lòng kiểm tra lại.`;

    const telegramUrl = `https://api.telegram.org/bot7860571662:AAH8nOTFpadyMUAngFrzkjBVcit64-szFB4/sendMessage?chat_id=${
      message.chat.id
    }&text=${encodeURIComponent(responseMessage)}`;

    axios
      .get(telegramUrl)
      .then((response) => {
        // Gửi phản hồi lại web (trạng thái thanh toán)
        sendPaymentStatusToWeb(ip, status);
        res.send("Phản hồi đã được gửi");
      })
      .catch((error) => {
        console.error("Lỗi phản hồi:", error);
        res.send("Không thể gửi phản hồi");
      });
  } else {
    res.send("Không có phản hồi callback");
  }
});

// Gửi trạng thái thanh toán đến web (ví dụ: thông báo trạng thái thanh toán thành công)
function sendPaymentStatusToWeb(ip, status) {
  console.log(`Sending payment status: ${status} for IP: ${ip}`); // Debug log

  axios
    .post("https://paymentvps.vercel.app/paymentStatus", {
      ip,
      status,
    })
    .then((response) => {
      console.log("Thông báo thanh toán đã được gửi đến website");
    })
    .catch((error) => {
      console.error("Lỗi gửi thông báo đến website:", error);
    });
}

// API endpoint để nhận trạng thái thanh toán từ webhook
app.post("/paymentStatus", express.json(), (req, res) => {
  const { ip, status } = req.body;
  console.log(`Trạng thái thanh toán cho VPS ${ip}: ${status}`);
  // Gửi thông báo đến frontend hoặc xử lý thêm ở đây
  res.send("Trạng thái thanh toán đã được nhận");
});

// Phục vụ các tệp tĩnh (frontend)
app.use(express.static(path.join(__dirname, "public"))); // Sử dụng path.join để đảm bảo đường dẫn đúng

// Đảm bảo khi truy cập trang chủ sẽ trả về tệp index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Cài đặt webhook (bắt đầu lắng nghe tin nhắn phản hồi từ Telegram)
app.post("/setWebhook", (req, res) => {
  axios
    .post(
      `https://api.telegram.org/bot7860571662:AAH8nOTFpadyMUAngFrzkjBVcit64-szFB4/setWebhook?url=https://paymentvps.vercel.app/webhook`
    )
    .then((response) => {
      console.log("Webhook set successfully:", response.data); // Debug log
      res.send("Webhook đã được thiết lập");
    })
    .catch((error) => {
      console.error("Error setting webhook:", error);
      res.send("Lỗi thiết lập webhook");
    });
});

app.listen(port, () => {
  console.log(`Server đang chạy trên http://localhost:${port}`);
});
