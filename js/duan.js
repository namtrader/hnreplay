// Hàm để tải và hiển thị danh sách dự án
function loadDuan() {
    const duanList = document.getElementById('duanList');
    duanList.innerHTML = ''; // Xóa danh sách hiện tại

    // Lấy tất cả các mục trong storage
    chrome.storage.local.get(null, function(items) {
        for (const key in items) {
            if (key.startsWith('duan_')) { // Chỉ lấy các mục có key bắt đầu bằng "duan_"
                const duan = items[key];
                const newListItem = document.createElement('li');

                // Tạo thẻ span để cho phép chỉnh sửa
                const duanName = document.createElement('span');
                duanName.textContent = duan.name;
                duanName.contentEditable = "true"; // Cho phép chỉnh sửa
                duanName.onblur = function() {
                    // Khi mất tiêu điểm, lưu lại tên đã chỉnh sửa
                    const updatedName = duanName.textContent;
                    if (updatedName !== duan.name) { // Nếu có thay đổi
                        const updatedDuan = { id: duan.id, name: updatedName }; // Cập nhật đối tượng dự án
                        saveData(key, updatedDuan, loadDuan); // Lưu thay đổi
                    }
                };

                newListItem.appendChild(duanName); // Thêm thẻ span vào danh sách

                // Thêm nút "Tải CSV"
                const taiCsvButton = document.createElement('button');
                taiCsvButton.textContent = 'Tải CSV';
                taiCsvButton.onclick = function() {
                    showTrades(duan.id, trades => exportToCSV(trades, duan.name)); // Gọi hàm showTrades và xuất dữ liệu CSV
                };

                // Thêm nút "Xóa"
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Xóa';
                deleteButton.onclick = function() {
                    // Xác nhận xóa
                    if (confirm(`Cảnh báo!\nBạn có chắc chắn muốn xóa dự án "${duan.name}" không?`)) {
                        deleteData(key, loadDuan); // Sử dụng hàm deleteData từ db.js
                        deleteTrades(duan.id);
                    }
                };

                newListItem.appendChild(taiCsvButton);
                newListItem.appendChild(deleteButton);
                duanList.appendChild(newListItem);
            }
        }
    });
}


// Hàm để thêm dự án mới
function addDuan() {
    const duanName = document.getElementById('duanName').value;

    if (duanName) { // Chỉ kiểm tra duanName
        const duanId = Date.now().toString(); // Sử dụng timestamp làm ID duy nhất
        const duanData = { id: duanId, name: duanName }; // Bỏ description

        saveData(`duan_${duanId}`, duanData, () => {
            loadDuan(); // Tải lại danh sách dự án
            clearInputs(); // Xóa các ô nhập liệu
        });
        // lưu id dự án
        chrome.storage.local.set({ setting_duanlastId: duanId }, () => {
            console.log('Đã lưu ID dự án:', duanId);
        });
    } else {
        alert("Vui lòng nhập tên dự án!"); // Thông báo lỗi khi không có tên
    }
}

// Hàm để tải và hiển thị danh sách loại lệnh
function loadLoailenh() {
    const loailenhList = document.getElementById('loailenhList');
    loailenhList.innerHTML = ''; // Xóa danh sách hiện tại

    // Lấy tất cả các mục trong storage
    chrome.storage.local.get(null, function(items) {
        for (const key in items) {
            if (key.startsWith('loailenh_')) { // Chỉ lấy các mục có key bắt đầu bằng "loailenh_"
                const loailenh = items[key];
                const newListItem = document.createElement('li');

                // Tạo thẻ span để cho phép chỉnh sửa
                const loailenhName = document.createElement('span');
                loailenhName.textContent = loailenh.name;
                loailenhName.contentEditable = "true"; // Cho phép chỉnh sửa
                loailenhName.onblur = function() {
                    // Khi mất tiêu điểm, lưu lại tên đã chỉnh sửa
                    const updatedName = loailenhName.textContent;
                    if (updatedName !== loailenh.name) { // Nếu có thay đổi
                        const updatedLoailenh = { id: loailenh.id, name: updatedName }; // Cập nhật đối tượng loại lệnh
                        saveData(key, updatedLoailenh, loadLoailenh); // Lưu thay đổi
                    }
                };

                newListItem.appendChild(loailenhName); // Thêm thẻ span vào danh sách

                // Thêm nút xóa
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Xóa';
                deleteButton.onclick = function() {
                    // Xác nhận xóa
                    if (confirm(`Bạn có chắc chắn muốn xóa loại lệnh "${loailenh.name}" không?`)) {
                        deleteData(key, loadLoailenh); // Sử dụng hàm deleteData từ db.js
                    }
                };

                newListItem.appendChild(deleteButton);
                loailenhList.appendChild(newListItem);
            }
        }
    });
}

// Hàm để thêm loại lệnh mới
function addLoailenh() {
    const loailenhName = document.getElementById('loailenhName').value;

    if (loailenhName) { // Chỉ kiểm tra loailenhName
        const loailenhId = Date.now().toString(); // Sử dụng timestamp làm ID duy nhất
        const loailenhData = { id: loailenhId, name: loailenhName }; // Bỏ description

        saveData(`loailenh_${loailenhId}`, loailenhData, () => {
            loadLoailenh(); // Tải lại danh sách loại lệnh
            clearLoailenhInputs(); // Xóa các ô nhập liệu
        });
    } else {
        alert("Vui lòng nhập tên loại lệnh!"); // Thông báo lỗi khi không có tên
    }
}

function deleteTrades(duan) {
    if (!duan) {
        console.error('Dự án không hợp lệ.');
        return;
    }

    // Lấy tất cả giao dịch
    chrome.storage.local.get(null, items => {
        // Lọc các keys có trade_ và thuộc dự án duan
        const keysToDelete = Object.keys(items).filter(key => {
            const tradeData = items[key];
            // Kiểm tra xem tradeData có trường duan không và nếu có thì so sánh với duan
            return tradeData && key.startsWith('trade_') && tradeData.duan === duan;
        });

        // Nếu không có giao dịch nào được tìm thấy
        if (keysToDelete.length === 0) {
            console.log('Không tìm thấy giao dịch nào để xóa cho dự án:', duan);
            return; // Kết thúc hàm nếu không có gì để xóa
        }

        // Xóa từng giao dịch
        chrome.storage.local.remove(keysToDelete, () => {
            console.log('Đã xóa các giao dịch cho dự án:', duan);
            // Có thể gọi lại hàm để tải lại dữ liệu sau khi xóa
            // loadTradeStats(); // Gọi hàm để cập nhật giao diện nếu cần
        });
    });
}

// Hàm để xuất dữ liệu giao dịch ra CSV
function exportToCSV(trades, duanName) {
    if (!trades || trades.length === 0) {
        console.log("Không có dữ liệu để xuất.");
        return;
    }

    // Tạo tiêu đề và nội dung cho CSV
    const headers = ["STT", "Thời gian", "Cặp tiền", "R:R", "Buy/Sell", "SL/TP", "RR thực tế", "Ảnh", "Loại lệnh", "Khung"]; // Thêm các tiêu đề khác nếu có

    // Tạo một Promise để lấy thông tin loại lệnh và xây dựng hàng CSV
    const promises = trades.map((trade, index) => {
        return new Promise((resolve) => {
            chrome.storage.local.get(`loailenh_${trade.loailenh}`, (result) => {
                const loailenhName = result[`loailenh_${trade.loailenh}`]?.name;
                
                // Tạo hàng dữ liệu cho CSV
                const rowData = [
                    index + 1, // STT: bắt đầu từ 1
                    trade.date,
                    trade.pair,
                    trade.rr,
                    trade.buysell,
                    trade.sltp,
                    trade.rrtt,
                    trade.anh,
                    loailenhName,
                    trade.khung
                ];
                resolve(rowData); // Trả về hàng dữ liệu
            });
        });
    });

    // Khi tất cả các Promise được giải quyết, xuất CSV
    Promise.all(promises).then(finalRows => {
        // Tạo nội dung CSV
        let csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...finalRows.map(row => row.join(","))].join("\n");

        // Tạo và kích hoạt liên kết tải file CSV với tên là duan.name.csv
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${duanName}.csv`); // Đặt tên file là duan.name.csv
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}


// Hàm để hiển thị các giao dịch và xuất sang CSV
function showTrades(duan, callback) {
    if (!duan) {
        console.error('Dự án không hợp lệ.');
        return;
    }

    chrome.storage.local.get(null, items => {
        const tradesToShow = Object.keys(items).filter(key => {
            const tradeData = items[key];
            return tradeData && key.startsWith('trade_') && tradeData.duan === duan;
        }).map(key => items[key]);

        if (tradesToShow.length === 0) {
            console.log('Không tìm thấy giao dịch nào cho dự án:', duan);
            return;
        }

        console.log('Danh sách giao dịch:', tradesToShow);
        
        // Gọi callback để xuất CSV nếu có
        if (typeof callback === "function") {
            callback(tradesToShow);
        }
    });
}


// Hàm để xóa các ô nhập liệu dự án
function clearInputs() {
    document.getElementById('duanName').value = '';
}

// Hàm để xóa các ô nhập liệu loại lệnh
function clearLoailenhInputs() {
    document.getElementById('loailenhName').value = '';
}

// Lấy cài đặt từ chrome.storage
function getHnbacktestSetting(callback) {
    chrome.storage.local.get(['hnbacktest_setting'], function(result) {
        // Trả về đối tượng hnbacktest_setting nếu tồn tại, hoặc một đối tượng rỗng nếu không
        const settings = result.hnbacktest_setting || {};
        callback(settings);
    });
}

// Sử dụng cài đặt từ chrome.storage trong việc tải lên Cloudinary
function downloadJson() {
    chrome.storage.local.get(null, function(items) {
        const jsonData = JSON.stringify(items, null, 2);

        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
        const fileName = `data_trade_${dateStr}_${timeStr}.json`;  // Thêm giờ, phút, giây vào tên tệp

        // Tạo Blob để tải xuống
        const blob = new Blob([jsonData], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Lấy cài đặt Cloudinary từ chrome.storage
        getHnbacktestSetting(function(settings) {
            const CLOUD_NAME = settings.CLOUD_NAME;
            const CLOUDINARY_UPLOAD_PRESET = settings.CLOUDINARY_UPLOAD_PRESET;

            // Kiểm tra nếu Cloudinary đã được kích hoạt
            if (settings && settings.hasOwnProperty('isCloudinaryEnabled') && settings.isCloudinaryEnabled === 1) {
                const formData = new FormData();
                formData.append('file', blob, fileName); // Đặt blob JSON vào formData
                formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET); // Sử dụng preset từ Cloudinary
                formData.append('public_id', fileName); // Truyền fileName đúng cách

                fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    console.log("Đã tải lên Cloudinary thành công:", data);
                    alert("Đã backup dữ liệu lên Cloudinary.");
                })
                .catch(error => {
                    console.error("Lỗi khi tải lên Cloudinary:", error);
                });
            } else {
                console.log("Cloudinary không được kích hoạt.");
            }
        });
    });
}

// Hàm để nhập khẩu dữ liệu từ file JSON
function importData() {
    // Hiển thị hộp thoại xác nhận trước khi thay thế dữ liệu
    const userConfirmed = confirm("Bạn có chắc chắn muốn thay thế dữ liệu cũ bằng dữ liệu mới?");
    
    if (userConfirmed) {
        const fileInput = document.getElementById('importFile');
        const file = fileInput.files[0]; // Lấy file đã chọn

        if (file) {
            const reader = new FileReader();

            reader.onload = function(event) {
                const data = event.target.result; // Dữ liệu file dưới dạng text
                try {
                    const parsedData = JSON.parse(data); // Chuyển đổi dữ liệu JSON thành đối tượng JavaScript
                    // Thay thế dữ liệu cũ với dữ liệu mới
                    chrome.storage.local.clear(() => { // Xóa toàn bộ dữ liệu cũ
                        // Lưu lại dữ liệu mới vào chrome.storage.local
                        chrome.storage.local.set(parsedData, function() {
                            loadDuan(); // Tải lại danh sách dự án
                            loadLoailenh(); // Tải lại danh sách loại lệnh
                        });
                    });
                } catch (error) {
                    alert("Lỗi khi phân tích dữ liệu: " + error);
                }
            };

            reader.readAsText(file); // Đọc file dưới dạng text
        } else {
            alert("Vui lòng chọn file để nhập khẩu.");
        }
    } else {
        alert("Quá trình nhập khẩu dữ liệu đã bị hủy.");
    }
}

// Gọi hàm để tải danh sách dự án khi trang được mở
document.addEventListener('DOMContentLoaded', () => {
    loadDuan(); // Tải danh sách dự án
    loadLoailenh(); // Tải danh sách loại lệnh
});

document.getElementById('addDuanBtn').addEventListener('click', addDuan);
// Thêm sự kiện cho nút thêm loại lệnh
document.getElementById('addLoailenhBtn').addEventListener('click', addLoailenh);

// Gán sự kiện click cho nút nhập khẩu
document.getElementById('importDataBtn').addEventListener('click', importData);
// Thêm sự kiện cho nút "Tải JSON"
document.getElementById('downloadJsonBtn').addEventListener('click', downloadJson);

// Gán sự kiện click cho nút xóa toàn bộ dữ liệu
document.getElementById('clearDataBtn').addEventListener('click', function() {
    // Hiển thị hộp thoại xác nhận
    const confirmation = confirm('Cảnh báo!\nBạn có chắc chắn muốn xóa tất cả dữ liệu?');
    if (confirmation) {
        clearAllData(function() {
            console.log('Đã hoàn tất xóa toàn bộ dữ liệu.');
            location.reload();
        });
    } else {
        console.log('Hành động xóa đã bị hủy.');
    }
});