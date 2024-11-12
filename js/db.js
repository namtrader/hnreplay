// Hàm chung để lưu dữ liệu
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

// Hàm chung để lấy dữ liệu
function getData(key, callback) {
    chrome.storage.local.get(key, function(result) {
        if (chrome.runtime.lastError) {
            console.error('Lỗi khi lấy dữ liệu:', chrome.runtime.lastError);
        } else {
            console.log(`Dữ liệu đã tải với key ${key}:`, result[key]);
            if (callback) callback(result[key]);
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

// Hàm chung để xóa dữ liệu theo key
function deleteData(key, callback) {
    // Ép kiểu key thành string
    const stringKey = String(key);

    chrome.storage.local.remove(stringKey, function() {
        if (chrome.runtime.lastError) {
            console.error('Lỗi khi xóa dữ liệu:', chrome.runtime.lastError);
        } else {
            console.log(`Dữ liệu với key ${stringKey} đã được xóa.`);
            if (callback) callback();
        }
    });
}

// Hàm để xóa toàn bộ dữ liệu
function clearAllData(callback) {
    chrome.storage.local.clear(function() {
        if (chrome.runtime.lastError) {
            console.error('Lỗi khi xóa dữ liệu:', chrome.runtime.lastError);
        } else {
            console.log('Tất cả dữ liệu đã được xóa.');
            if (callback) callback();
        }
    });
}
