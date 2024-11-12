// Mở tab dự án
document.getElementById('openCategoryTab').addEventListener('click', function() {
    chrome.tabs.create({ url: 'duan.html' });
});

// Mở tab thống kê
document.getElementById('openThongkeTab').addEventListener('click', function() {
    chrome.tabs.create({ url: 'thongke.html' });
});

// Mở tab thống kê
document.getElementById('openCaidatTab').addEventListener('click', function() {
    chrome.tabs.create({ url: 'caidat.html' });
});
