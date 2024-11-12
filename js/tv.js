let duan = []; // Biến toàn cục để lưu mảng dự án
let loailenh = []; // Biến toàn cục để lưu mảng loại lệnh
let duanLastId = ''; // Biến toàn cục để lưu ID dự án cuối cùng

// Chèn script vào trang
function injectScript() {
    // Tạo một thẻ <script> và chèn vào trang
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('js/snapshot.js');
    (document.head || document.documentElement).appendChild(script);
    script.onload = function() {
        script.remove(); // Xóa thẻ sau khi đã chèn xong
    };
};

function saveData(key, data, callback) {
    chrome.storage.local.set({ [key]: data }, function() {
        if (chrome.runtime.lastError) {
            console.error('Lỗi khi lưu dữ liệu:', chrome.runtime.lastError);
        } else {
            console.log(`Đã lưu dữ liệu với key ${key}:`, data);
            if (callback) callback();
        }
    });
}

// Hàm chung để cập nhật dữ liệu theo key
function updateData(key, newData, callback) {
    chrome.storage.local.get(key, function(result) {
        if (chrome.runtime.lastError) {
            console.error('Lỗi khi lấy dữ liệu:', chrome.runtime.lastError);
        } else {
            const existingData = result[key];
            if (existingData) {
                const updatedData = { ...existingData, ...newData };
                chrome.storage.local.set({ [key]: updatedData }, function() {
                    if (chrome.runtime.lastError) {
                        console.error('Lỗi khi cập nhật dữ liệu:', chrome.runtime.lastError);
                    } else {
                        console.log(`Dữ liệu với key ${key} đã được cập nhật:`, updatedData);
                        if (callback) callback(updatedData);
                    }
                });
            } else {
                console.warn(`Không tìm thấy dữ liệu với key ${key} để cập nhật.`);
                if (callback) callback(null);
            }
        }
    });
}

// Hàm để cập nhật dữ liệu khi người dùng chỉnh sửa
function updateTrade(key, field, value) {
    const tradeData = { [field]: value }; // Tạo đối tượng với trường đã sửa
    updateData(key, tradeData); // Không callback hàm loadTradeStats
}

function loadSettings() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['hnbacktest_setting'], function(result) {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            // Nếu không có cài đặt nào, sử dụng cài đặt mặc định
            resolve(result.hnbacktest_setting);
        });
    });
}

// Hàm để lấy ID dự án cuối cùng
function getDuanLastId() {
    return new Promise((resolve) => {
        chrome.storage.local.get('setting_duanlastId', data => {
            duanLastId = data.setting_duanlastId || ''; // Gán giá trị vào biến toàn cục
            console.log(`ID dự án cuối cùng: ${duanLastId}`); // Hiển thị ID cuối cùng
            resolve();
        });
    });
}

// Hàm để lấy tất cả loại lệnh dưới dạng mảng [id: name]
function getLoailenhArray() {
    return new Promise((resolve) => {
        const loailenhArray = []; // Mảng để lưu các đối tượng [id: name]

        // Lấy tất cả các mục trong storage
        chrome.storage.local.get(null, function(items) {
            for (const key in items) {
                if (key.startsWith('loailenh_')) { // Chỉ lấy các mục có key bắt đầu bằng "loailenh_"
                    const loailenhItem = items[key];
                    loailenhArray.push({ [loailenhItem.id]: loailenhItem.name }); // Thêm đối tượng [id: name] vào mảng
                }
            }
            loailenh = loailenhArray; // Cập nhật biến toàn cục
            resolve(loailenhArray); // Gọi callback với mảng loailenhArray
        });
    });
}

// Hàm để lấy tất cả dự án dưới dạng mảng [id: name]
function getDuanArray() {
    return new Promise((resolve) => {
        const duanArray = []; // Mảng để lưu các đối tượng [id: name]

        // Lấy tất cả các mục trong storage
        chrome.storage.local.get(null, function(items) {
            for (const key in items) {
                if (key.startsWith('duan_')) { // Chỉ lấy các mục có key bắt đầu bằng "duan_"
                    const duanItem = items[key];
                    duanArray.push({ [duanItem.id]: duanItem.name }); // Thêm đối tượng [id: name] vào mảng
                }
            }
            duan = duanArray; // Cập nhật biến toàn cục
            resolve(duanArray); // Gọi callback với mảng duanArray
        });
    });
}

// Hàm để tạo style
function createStyles() {
    const style = document.createElement('style');
    style.textContent = `
        #hnBacktestTable {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 20px;
            background-color: white;
            z-index: 1000;
            width: 250px;
            color: black;
            box-sizing: border-box;
            border: 1px solid black;
        }
        .loailenh-block {
            margin-bottom: 5px;
            background-color: #f0f0f0;
        }
        #loailenhMain { color: #3179f5; }
        #loailenhMain label:hover {
            background-color: #ffd700;
        }
        #hnBacktestTable input[type="radio"] { display: none; }
        #hnBacktestTable label {
            display: block;
            padding: 5px;
        }
        #hnBacktestTable input[type="radio"]:checked + label {
            background-color: #89d70c;
            border-color: #007bff;
        }
        #ghichuMain, #anhMain, #dateMain, #rrttMain {
            color: black;
            background-color: antiquewhite;
        }
        #duanMain {
            background-color: wheat;
            width: 100%;
        }
        .hn-win-btn { background-color: green; }
        .hn-loss-btn { background-color: red; }
        .hn-draw-btn { background-color: yellow; }
        .hn-miss-btn { background-color: orange; }
    `;
    document.head.appendChild(style);
};

// Hàm tạo HTML cho danh sách dự án
function createDuanHTML() {
    const optionsHTML = duan.map(item => {
        const id = Object.keys(item)[0]; // Lấy ID từ đối tượng
        const name = item[id]; // Lấy tên dự án từ ID
        return `
            <option value="${id}" ${duanLastId === id ? 'selected' : ''}>${name}</option>
        `;
    }).join('');
    
    return `
        <label for="duanMain">Chọn dự án:</label>
        <select id="duanMain" name="duanMain">${optionsHTML}</select>
    `;
};

// Hàm tạo HTML cho các loại
function createLoailenhHTML() {
    return loailenh.map(item => {
        const id = Object.keys(item)[0]; // Lấy ID từ đối tượng
        const name = item[id]; // Lấy tên loại lệnh từ ID
        return `
            <div class="loailenh-block">
                <input type="radio" id="loai-lenh-${id}" name="loailenh" data-name="${name}" value="${id}">
                <label for="loai-lenh-${id}">${name}</label>
            </div>
        `;
    }).join('');
};

// Hàm tạo container chính
function createContainerHTML() {
    const duanHTML = createDuanHTML(); // Gọi hàm tạo HTML cho loại
    const loailenhHTML = createLoailenhHTML(); // Gọi hàm tạo HTML cho loại

    return `
        <div id="hnBacktestTable">
            ${duanHTML}
            <label>Loại lệnh:</label>
            <div id="loailenhMain">${loailenhHTML}</div>
            <label for="ghichuMain">Ghi chú:</label>
            <textarea style="width: 100%;" id="ghichuMain"></textarea>
            <label>Link ảnh:</label>
            <input type="url" id="anhMain" autocomplete="off" style="width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; width: 100%;">
                <div style="flex: 1; margin-right: 5px;">
                    <label style="font-size: 12px;" for="datetimeMain">Ngày, Tháng, Năm, Giờ:</label>
                    <input type="text" id="dateMain" placeholder="dd-mm-yyyy hh:mm" autocomplete="off" maxlength="16" style="width: 160px; box-sizing: border-box;">
                </div>
                
                <div style="flex: 1;">
                    <label style="font-size: 12px;" for="rrtt">RRTT:</label>
                    <input type="number" id="rrttMain" style="width: 50px; box-sizing: border-box;" min="-100" step="any">
                </div>
            </div>

            <div style="display: flex; justify-content: center; margin-bottom: 15px; gap: 5px;">
                <button class="hn-win-btn">Thắng</button>
                <button class="hn-loss-btn">Thua</button>
                <button class="hn-draw-btn">Hoà</button>
                <button class="hn-miss-btn">Hụt</button>
            </div>
        </div>
    `;
};

async function addBacktestBtn() {
    const targetDiv = document.querySelector('div[data-name="source-properties-editor"] > div[class^="footer-"]');
    const unitElement = document.querySelector('#header-toolbar-symbol-search > div[class*="text-"]');
    let timeFrameInput = document.querySelector('#header-toolbar-intervals button[aria-checked="true"] div[class^="value-"]') 
                      || document.querySelector('#header-toolbar-intervals button[aria-haspopup="menu"] div[class^="value-"]');
    const entryPriceInput = document.querySelector('input[data-property-id="Risk/RewardlongEntryPrice"], input[data-property-id="Risk/RewardshortEntryPrice"]');
    const profitPriceInput = document.querySelector('input[data-property-id="Risk/RewardlongProfitLevelPrice"], input[data-property-id="Risk/RewardshortProfitLevelPrice"]');
    const stopLevelInput = document.querySelector('input[data-property-id="Risk/RewardlongStopLevelPrice"], input[data-property-id="Risk/RewardshortStopLevelPrice"]');

    if (targetDiv && !document.getElementById('hnBacktestTable') && entryPriceInput) {
        targetDiv.insertAdjacentHTML('afterbegin', createContainerHTML());

        // ngày giờ
        document.getElementById('dateMain').addEventListener('input', formatDateTimeInput);

        const handleTradeClick = async (sltpMain) => {
            if (entryPriceInput && stopLevelInput && unitElement) {
                const entryPrice = parseFloat(entryPriceInput.value);
                const profitPrice = parseFloat(profitPriceInput ? profitPriceInput.value : '0');
                const stopLossPrice = parseFloat(stopLevelInput.value);
                const pair = unitElement.textContent.trim();
                const timeFrame = timeFrameInput.textContent;

                let orderType = '';
                let rr = 0;

                // Xác định loại lệnh và tính RR
                if (profitPrice > entryPrice && stopLossPrice < entryPrice) {
                    orderType = 'buy';
                    rr = (profitPrice - entryPrice) / (entryPrice - stopLossPrice);
                } else if (profitPrice < entryPrice && stopLossPrice > entryPrice) {
                    orderType = 'sell';
                    rr = (entryPrice - profitPrice) / (stopLossPrice - entryPrice);
                } else {
                    console.error('Giá không hợp lệ cho lệnh Buy hoặc Sell!');
                    return;
                }

                const dateMain = document.getElementById('dateMain').value || convertTimestampToDate(Date.now());
                const rrMain = rr.toFixed(1);
                const buysellMain = orderType;
                const loailenhInput = document.querySelector('input[name="loailenh"]:checked');
                const loailenhMain = loailenhInput ? loailenhInput.value : '';
                const loailenhMainName = loailenhInput ? loailenhInput.getAttribute('data-name') : '';
                const ghichuMain = document.getElementById('ghichuMain').value;
                const duanMain = document.getElementById('duanMain').value;
                const idMain = Date.now().toString();
                const anhMain = document.getElementById('anhMain').value;

                let rrttMain;

                // Cập nhật giá trị rrttMain dựa trên sltpMain
                if (sltpMain === 'sl') {
                    rrttMain = -1; // Nếu là 'sl' thì rrtt là -1
                } else if (sltpMain === 'hut' || sltpMain === 'hoa') {
                    rrttMain = 0; // Nếu là 'hut' hoặc 'hoa' thì rrtt là 0
                } else {
                    // Lấy giá trị từ input 'rrttMain' nếu có, nếu không lấy từ rrMain
                    rrttMain = rrttMain = document.getElementById('rrttMain').value || rrMain;
                }

                // Đóng popup
                const cancelButton = document.querySelector('button[name="cancel"]');
                cancelButton.click();

                duanLastId = duanMain;
                chrome.storage.local.set({ setting_duanlastId: duanLastId }, () => {
                    console.log('Đã lưu ID thể loại cuối cùng được chọn:', duanLastId);
                });
                const tradeData = {
                    id: idMain, // Tạo ID duy nhất
                    date: dateMain, // Ngày giao dịch
                    pair: pair, // Cặp tiền
                    rr: rrMain, // Tỷ lệ R:R
                    buysell: buysellMain, // Mua/Bán
                    sltp: sltpMain, // SL/TP
                    rrtt: rrttMain, // RR thực tế
                    anh: anhMain, // Liên kết ảnh
                    loailenh: loailenhMain, // Loại lệnh
                    khung: timeFrame, // Khung thời gian
                    ghichu: ghichuMain, // Ghi chú
                    duan: duanMain // Dự án
                };
                saveData(`trade_${tradeData.id}`, tradeData);
                if (!anhMain) {
                    const settings = await loadSettings();
                    console.log('Cài đặt:', settings);

                    if (settings && settings.hasOwnProperty('isCloudinaryEnabled') && settings.isCloudinaryEnabled === 1) {
                        // Gọi api chèn
                        injectScript();

                        window.addEventListener("message", (event) => {
                            // Chỉ xử lý các tin nhắn từ injectedScript
                            if (event.source !== window) return;

                            if (event.data.type && event.data.type === "SNAPSHOT") {
                                console.log("Received data from injected script:", event.data.message);
                                if (event.data.message) {
                                    const data = {
                                        CLOUD_NAME: settings.CLOUD_NAME,
                                        CLOUDINARY_UPLOAD_PRESET: settings.CLOUDINARY_UPLOAD_PRESET,
                                        fileName: `${pair}_${idMain}`
                                    };
                                    takeClientScreenshot(event.data.message, data)
                                        .then(screenshotUrl => {
                                            console.log("Uploaded screenshot URL:", screenshotUrl);
                                            updateTrade(`trade_${idMain}`, 'anh', screenshotUrl);
                                        })
                                        .catch(error => {
                                            console.error("Có lỗi xảy ra khi tải ảnh lên:", error);
                                        });
                                }
                            }
                        });
                    }
                   
                }

            } else {
                alert('Không tìm thấy trường dữ liệu hoặc cặp tiền!');
            }
        };

        // Thêm event listeners
        document.querySelector('.hn-win-btn').addEventListener('click', () => handleTradeClick('tp'));
        document.querySelector('.hn-loss-btn').addEventListener('click', () => handleTradeClick('sl'));
        document.querySelector('.hn-draw-btn').addEventListener('click', () => handleTradeClick('hoa'));
        document.querySelector('.hn-miss-btn').addEventListener('click', () => handleTradeClick('hut'));
    }
};

// Hàm tải ảnh lên Cloudinary
async function takeClientScreenshot(blob, data) {
    // Truy cập các giá trị trong mảng data
    const CLOUD_NAME = data['CLOUD_NAME']; // Sử dụng tên khóa đúng
    const CLOUDINARY_UPLOAD_PRESET = data['CLOUDINARY_UPLOAD_PRESET']; // Sử dụng tên khóa đúng
    const fileName = data['fileName']; // Sử dụng tên khóa đúng

    // Tạo formData và gửi yêu cầu tải lên Cloudinary
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('public_id', fileName); // Truyền fileName đúng cách

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const imageUrl = result.secure_url;
        console.log('File uploaded to Cloudinary:', imageUrl);

        return imageUrl;
    } catch (error) {
        console.error('Lỗi khi tải lên Cloudinary:', error);
        throw error; // Ném lỗi lên để xử lý bên ngoài nếu cần
    }
}

function formatDateTimeInput(event) {
    // Lấy giá trị hiện tại và loại bỏ các ký tự không phải số
    let value = event.target.value.replace(/[^0-9-: ]/g, '');

    // Tự động thêm dấu '-' sau khi nhập đủ 2 ký tự cho ngày
    if (value.length >= 2 && value[2] !== '-') {
        value = value.slice(0, 2) + '-' + value.slice(2);
    }
    // Tự động thêm dấu '-' sau khi nhập đủ 2 ký tự cho tháng
    if (value.length >= 5 && value[5] !== '-') {
        value = value.slice(0, 5) + '-' + value.slice(5);
    }
    // Tự động thêm dấu cách ' ' sau khi nhập đủ 4 ký tự cho năm
    if (value.length >= 10 && value[10] !== ' ') {
        value = value.slice(0, 10) + ' ' + value.slice(10);
    }
    // Tự động thêm dấu ':' sau khi nhập đủ 2 ký tự cho giờ
    if (value.length >= 13 && value[13] !== ':') {
        value = value.slice(0, 13) + ':' + value.slice(13);
    }

    // Cập nhật giá trị input
    event.target.value = value;

    // Xử lý trường hợp xóa ký tự
    if (event.inputType === 'deleteContentBackward') {
        const cursorPosition = event.target.selectionStart;

        // Nếu ký tự cuối cùng là dấu phân cách, xóa nó khi người dùng xóa
        if (value[cursorPosition - 1] === '-' || value[cursorPosition - 1] === ' ' || value[cursorPosition - 1] === ':') {
            event.target.value = value.slice(0, cursorPosition - 1) + value.slice(cursorPosition);
            event.target.setSelectionRange(cursorPosition - 1, cursorPosition - 1); // Đặt lại vị trí con trỏ
        }
    }
}

// Hàm chuyển đổi timestamp thành định dạng ngày
function convertTimestampToDate(timestamp) {
    // Chuyển đổi giá trị thành đối tượng Date
    const date = new Date(timestamp);

    // Lấy ngày, tháng, năm, giờ và phút
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Tháng trong JavaScript bắt đầu từ 0
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    // Định dạng ngày-tháng-năm giờ:phút
    const formattedDateTime = `${day}-${month}-${year} ${hours}:${minutes}`;

    return formattedDateTime;
}

async function init() {
    try {
        await getDuanLastId(); // Đợi lấy ID dự án cuối cùng

        // Kiểm tra xem duanLastId có rỗng hay không và phải lớn hơn 0
        if (duanLastId && duanLastId > 0) {
            await getLoailenhArray(); // Lấy loại lệnh
            await getDuanArray(); // Lấy dự án
            createStyles(); // Tạo kiểu dáng
            addBacktestBtn(); // Thêm nút backtest

            // Theo dõi sự thay đổi của DOM để thêm nút động
            const observer = new MutationObserver(addBacktestBtn);
            observer.observe(document.body, { childList: true, subtree: true });
        } else {
            console.log('duanLastId không hợp lệ, không thể gọi initialize()');
        }
    } catch (error) {
        console.error('Có lỗi xảy ra:', error);
    }
}

// Gọi hàm init() để bắt đầu
init();
