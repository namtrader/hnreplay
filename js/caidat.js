// Thiết lập mặc định
const defaultSettings = {
    CLOUD_NAME: 'dmbpkzhvp',
    CLOUDINARY_UPLOAD_PRESET: 'hntrading',
    PerPage: 20,
    sortOrder: 'asc',
    isCloudinaryEnabled: 0
};

// Hàm lưu thiết lập
document.getElementById('saveButton').addEventListener('click', function() {
    const cloudinaryName = document.getElementById('cloudinaryName').value || defaultSettings.CLOUD_NAME;
    const uploadPreset = document.getElementById('uploadPreset').value || defaultSettings.CLOUDINARY_UPLOAD_PRESET;
    const perPage = parseInt(document.getElementById('perPage').value) || defaultSettings.PerPage;
    const sortOrder = document.getElementById('sortOrder').value || defaultSettings.sortOrder;
    const isCloudinaryEnabled = document.getElementById('cloudinaryToggle').checked ? 1 : 0;

    const newSetting = {
        CLOUD_NAME: cloudinaryName,
        CLOUDINARY_UPLOAD_PRESET: uploadPreset,
        PerPage: perPage,
        sortOrder: sortOrder,
        isCloudinaryEnabled: isCloudinaryEnabled
    };

    chrome.storage.local.set({ 'hnbacktest_setting': newSetting }, loadSettings);
});

// Hàm tải thiết lập vào form
function loadSettings() {
    chrome.storage.local.get(['hnbacktest_setting'], function(result) {
        let settings = result.hnbacktest_setting;

        // Nếu không có cài đặt nào được lưu, lưu cài đặt mặc định
        if (!settings) {
            settings = defaultSettings;
            chrome.storage.local.set({ 'hnbacktest_setting': settings });
        }

        // Cập nhật form với cài đặt đã tải
        document.getElementById('cloudinaryName').value = settings.CLOUD_NAME || defaultSettings.CLOUD_NAME;
        document.getElementById('uploadPreset').value = settings.CLOUDINARY_UPLOAD_PRESET || defaultSettings.CLOUDINARY_UPLOAD_PRESET;
        document.getElementById('perPage').value = settings.PerPage || defaultSettings.PerPage;
        document.getElementById('sortOrder').value = settings.sortOrder || defaultSettings.sortOrder;
        document.getElementById('cloudinaryToggle').checked = settings.isCloudinaryEnabled === 1;
    });
}

function getHnbacktestSetting(callback) {
    chrome.storage.local.get(['hnbacktest_setting'], function(result) {
        // Trả về đối tượng hnbacktest_setting nếu tồn tại, hoặc một đối tượng rỗng nếu không
        const settings = result.hnbacktest_setting || {};
        callback(settings);
    });
}
getHnbacktestSetting(function(settings) {
    console.log("CLOUD_NAME:", settings.CLOUD_NAME);
    console.log("CLOUDINARY_UPLOAD_PRESET:", settings.CLOUDINARY_UPLOAD_PRESET);
    console.log("PerPage:", settings.PerPage);
    console.log("sortOrder:", settings.sortOrder);
    console.log("cloudinaryToggle:", settings.isCloudinaryEnabled);
});

// Hàm đặt lại về thiết lập mặc định
document.getElementById('resetButton').addEventListener('click', function() {
    chrome.storage.local.set({ 'hnbacktest_setting': defaultSettings }, loadSettings);
});

// Tải thiết lập khi trang được tải
document.addEventListener('DOMContentLoaded', loadSettings);