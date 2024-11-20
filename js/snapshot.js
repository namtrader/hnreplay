(async function() {
    'use strict';

    // Kiểm tra và sử dụng window.TradingViewApi
    if (window.TradingViewApi) {
        try {;
            const screenshotCanvas = await window.TradingViewApi.takeClientScreenshot();
            const blobImg = await new Promise((resolve) => screenshotCanvas.toBlob(resolve, 'image/png'));

            const lastBarCloseTime = window.TradingViewApi.activeChart().getSeries()._series._lastBarCloseTime

            const message = {blobImg,  lastBarCloseTime};
            // Gửi dữ liệu qua postMessage
            window.postMessage({ type: "SNAPSHOT", message }, "*");
        } catch (error) {
            console.error("Error taking screenshot:", error);
        }
    } else {
        console.log("TradingView API is not available yet");
    }

    // Bạn có thể dùng setInterval để chờ TradingViewApi nếu cần
})();
