document.getElementById("generateQR").addEventListener("click", function () {
  const ip = document.getElementById("ipInput").value;
  if (ip) {
    // Gửi yêu cầu lấy giá VPS từ backend
    fetch(`/getPrice/${ip}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Mã lỗi " + response.status); // Kiểm tra nếu phản hồi không OK
        }
        return response.json();
      })
      .then((data) => {
        if (data.price) {
          const qrLink = `https://img.vietqr.io/image/TPB-03082410101-compact2.png?amount=${data.price}&addInfo=thanhtoan&accountName=Le%20Duc%20Thinh`;
          document.getElementById(
            "qrContainer"
          ).innerHTML = `<img src="${qrLink}" alt="QR Code">`;
          startCountdown();
          document.getElementById("paidBtn").style.display = "inline-block";
          window.paymentData = { ip, price: data.price };
        } else {
          alert("IP không hợp lệ.");
        }
      })
      .catch((error) => {
        console.error("Lỗi:", error);
      });
  } else {
    alert("Vui lòng nhập IP");
  }
});

// Hàm đếm ngược thời gian (5 phút)
function startCountdown() {
  let time = 5 * 60; // 5 minutes
  const countdownElement = document.getElementById("countdown");
  const interval = setInterval(function () {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    countdownElement.textContent = `Thời gian còn lại: ${minutes}:${
      seconds < 10 ? "0" + seconds : seconds
    }`;
    time--;
    if (time < 0) {
      clearInterval(interval);
      countdownElement.textContent = "Thời gian đã hết.";
    }
  }, 1000);
}

// Khi nhấn "Đã thanh toán", gửi yêu cầu tới backend để gửi tin nhắn Telegram
document.getElementById("paidBtn").addEventListener("click", function () {
  if (window.paymentData) {
    sendTelegramMessage(window.paymentData.ip, window.paymentData.price);
  }
});

// Gửi tin nhắn Telegram kèm 2 nút phản hồi
function sendTelegramMessage(ip, price) {
  fetch(`/sendTelegramMessage?ip=${ip}&price=${price}`)
    .then((response) => response.text())
    .then((data) => {
      console.log("Tin nhắn đã gửi: ", data);
    })
    .catch((error) => {
      console.error("Lỗi gửi tin nhắn:", error);
    });
}
