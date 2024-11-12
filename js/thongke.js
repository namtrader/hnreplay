// Biến toàn cục để lưu danh sách thể loại
let duanList = [];
let loailenhList = [];
let currentPage = 1;
let rowsPerPage = 50; // Số giao dịch mỗi trang
let totalPages = 9; // Số trang hiển thị
let totalTrades = 9; // Số trang hiển thị
let sortBy = 'id'; // Mặc định là giảm dần
let sortOrder = 'desc'; // Mặc định là giảm dần
let sortMonth = null; // Mặc định là giảm dần
let sortYear = null; // Mặc định là giảm dần
let sortSltp = null; // Mặc định là giảm dần

// Hàm để thêm một giao dịch mới
function addTrade() {
    const tradeData = {
        id: Date.now().toString(), // Tạo ID duy nhất
        date: document.getElementById('date').value || convertTimestampToDate(Date.now()),
        pair: document.getElementById('pair').value, // Cặp tiền
        rr: document.getElementById('rr').value, // Tỷ lệ R:R
        buysell: document.getElementById('buysell').value, // Mua/Bán
        sltp: document.getElementById('sltp').value, // SL/TP
        rrtt: document.getElementById('rrtt').value, // RR thực tế
        anh: document.getElementById('anh').value, // Liên kết ảnh
        loailenh: document.getElementById('loailenh').value, // Loại lệnh
        khung: document.getElementById('khung').value, // Khung thời gian
        ghichu: document.getElementById('ghichu').value, // Ghi chú
        duan: document.getElementById('duan').value // Dự án
    };

    // Kiểm tra nếu 'pair' trống thì không thực hiện lưu dữ liệu
    if (!tradeData.pair) {
        alert("Vui lòng nhập cặp tiền."); // Thông báo nếu cặp tiền trống
        return; // Dừng hàm nếu 'pair' không có giá trị
    }

    saveData(`trade_${tradeData.id}`, tradeData, () => {
        loadTradeStats(); // Tải lại thống kê giao dịch
    });
}

// Hàm để xóa một giao dịch
function deleteTrade(key) {
    if (!key) {
        console.error('Key không hợp lệ.');
        return;
    }
    deleteData(key, loadTradeStats); // Gọi hàm loadTradeStats trực tiếp
}

// Hàm để cập nhật dữ liệu khi người dùng chỉnh sửa
function updateTrade(key, field, value) {
    const tradeData = { [field]: value }; // Tạo đối tượng với trường đã sửa
    updateData(key, tradeData); // Không callback hàm loadTradeStats
}

// Hàm lấy tất cả giao dịch từ chrome.storage và lọc theo tháng/năm
function getAllTrades(sortBy = 'id', sortOrder = 'desc', month = null, year = null, sltp = null, callback) {
    chrome.storage.local.get(null, items => {
        const trades = Object.keys(items)
            .filter(key => key.startsWith('trade_'))
            .map(key => items[key]);
        
        let filteredTrades = trades; // Mặc định, không lọc, lấy tất cả giao dịch

        // Nếu có month và year, thực hiện lọc theo tháng/năm
        if (month && year) {
            filteredTrades = filterTradesByMonthYear(trades, month, year);
        }

        // Nếu có sltp, thực hiện lọc theo giá trị sltp (chỉ lọc khi sltp là mảng)
        if (Array.isArray(sltp)) {
            filteredTrades = filteredTrades.filter(trade =>
                sltp.includes(trade.sltp)
            );
        }

        // Sắp xếp các giao dịch theo thuộc tính và thứ tự yêu cầu
        filteredTrades.sort((a, b) => {
            let comparison = 0;

            // So sánh theo thuộc tính được chỉ định
            if (sortBy === 'id') {
                comparison = a.id.localeCompare(b.id);
            } else if (sortBy === 'pair') {
                comparison = a.pair.localeCompare(b.pair);
            } else if (sortBy === 'date') {
                comparison = new Date(a.date) - new Date(b.date); // so sánh ngày
            } else if (sortBy === 'rr') {
                comparison = a.rrtt - b.rrtt;
            } else if (sortBy === 'rrtt') {
                comparison = a.rrtt - b.rrtt;
            } else if (sortBy === 'khung') {
                comparison = a.khung.localeCompare(b.khung);
            } else if (sortBy === 'loailenh') {
                comparison = a.loailenh.localeCompare(b.loailenh);
            } else if (sortBy === 'buysell') {
                comparison = a.buysell.localeCompare(b.buysell);
            } else if (sortBy === 'sltp') {
                comparison = a.sltp.localeCompare(b.sltp);
            }
            // Có thể thêm các thuộc tính khác tại đây nếu cần

            // Thay đổi kết quả so sánh dựa trên sortOrder
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        // Gọi callback với kết quả đã lọc và sắp xếp
        callback(filteredTrades);  
    });
}

// Hàm chuyển đổi chuỗi ngày tháng 'DD-MM-YYYY HH:MM' thành đối tượng Date
function parseCustomDate(dateString) {
    const [datePart, timePart] = dateString.split(' ');  // Tách ngày và giờ
    const [day, month, year] = datePart.split('-');     // Tách ngày, tháng, năm

    // Kiểm tra và xử lý phần giờ và phút
    let [hour, minute] = timePart ? timePart.split(':') : ['00', '00'];  // Nếu không có thời gian, gán mặc định '00:00'

    // Nếu phần giờ hoặc phút không hợp lệ (chưa có hoặc không phải là số), gán mặc định
    hour = hour || '00';
    minute = minute || '00';

    // Tạo đối tượng Date theo định dạng YYYY-MM-DDTHH:MM
    const formattedDate = `${year}-${month}-${day}T${hour}:${minute}`;

    return new Date(formattedDate);  // Trả về đối tượng Date
}

// Hàm lọc giao dịch theo tháng và năm
function filterTradesByMonthYear(trades, month, year) {
    return trades.filter(trade => {
        const tradeDate = parseCustomDate(trade.date);  // Chuyển đổi ngày của giao dịch thành Date
        const tradeMonth = tradeDate.getMonth() + 1;    // getMonth() trả về từ 0 đến 11 (cần cộng thêm 1)
        const tradeYear = tradeDate.getFullYear();

        // So sánh với tháng và năm yêu cầu
        return tradeMonth === month && tradeYear === year;
    });
}

// Hàm để lấy tất cả thể loại từ storage và trả về Promise
function loadDuanData() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(null, items => {
            try {
                duanList = Object.keys(items)
                    .filter(key => key.startsWith('duan_'))
                    .map(key => items[key]);
                resolve(duanList);
            } catch (error) {
                reject(error);
            }
        });
    });
}

// Hàm để lấy tất cả thể loại từ storage và trả về Promise
function loadLoailenhData() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(null, items => {
            try {
                loailenhList = Object.keys(items)
                    .filter(key => key.startsWith('loailenh_'))
                    .map(key => items[key]);
                resolve(loailenhList);
            } catch (error) {
                reject(error);
            }
        });
    });
}

// Hàm để tạo và thêm một lựa chọn thể loại vào dropdown
function createDuanOption(duan, duanLastId) {
    const option = document.createElement('option');
    option.value = duan.id;
    option.textContent = duan.name;

    if (String(duan.id) === String(duanLastId)) {
        option.selected = true; // Đặt là đã chọn nếu khớp
    }
    return option;
}

// Hàm để tải và hiển thị các lựa chọn thể loại
function loadDuanOptions(duanLastId) {
    const duanSelect = document.getElementById('duan');
    if (!duanSelect) {
        console.error('Không tìm thấy phần tử duan.');
        return;
    }

    duanSelect.innerHTML = ''; // Xóa danh sách hiện tại

    // Tạo và thêm tùy chọn "Tất cả"
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'Tất cả';
    duanSelect.appendChild(allOption); // Thêm tùy chọn "Tất cả" vào dropdown

    // Thêm các tùy chọn thể loại từ duanList
    duanList.forEach(duan => {
        duanSelect.appendChild(createDuanOption(duan, duanLastId)); // Thêm từng lựa chọn
    });
}

// Hàm để tải và hiển thị các lựa chọn thể loại
function loadLoailenhOptions() {
    const loailenhSelect = document.getElementById('loailenh');
    if (!loailenhSelect) {
        console.error('Không tìm thấy phần tử loailenh.');
        return;
    }

    loailenhSelect.innerHTML = ''; // Xóa danh sách hiện tại

    // Tạo và thêm tùy chọn "Tất cả"
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'Tất cả';
    loailenhSelect.appendChild(allOption); // Thêm tùy chọn "Tất cả" vào dropdown

    // Thêm các tùy chọn loại lệnh từ loailenhList
    loailenhList.forEach(loailenh => {
        const option = document.createElement('option');
        option.value = loailenh.id;
        option.textContent = loailenh.name;
        loailenhSelect.appendChild(option); // Thêm từng lựa chọn
    });
}

// Hàm tìm kiếm tên thể loại dựa trên ID
function getDuanNameById(duanId) {
    const duan = duanList.find(item => item.id === duanId);
    return duan ? duan.name : '';
}

// Hàm lọc các giao dịch theo loại lệnh
function filterTradesByOrderType(orderType, trades) {
    return orderType === '' ? trades : trades.filter(trade => trade.duan === orderType);
}

function calculateStats(filteredTrades) {
    // Tổng số giao dịch
    const totalTrades = filteredTrades.length;

    // Đếm số giao dịch theo từng loại 'tp', 'sl', 'hoa', 'hut'
    const tpTrades = filteredTrades.filter(trade => trade.sltp && trade.sltp.toLowerCase() === 'tp').length;
    const slTrades = filteredTrades.filter(trade => trade.sltp && trade.sltp.toLowerCase() === 'sl').length;
    const hoaTrades = filteredTrades.filter(trade => trade.sltp && trade.sltp.toLowerCase() === 'hoa').length;
    const hutTrades = filteredTrades.filter(trade => trade.sltp && trade.sltp.toLowerCase() === 'hut').length;

    // Tính tỷ lệ phần trăm cho mỗi loại giao dịch
    const tpRate = totalTrades > 0 ? ((tpTrades / totalTrades) * 100).toFixed(2) + '%' : '0%';
    const slRate = totalTrades > 0 ? ((slTrades / totalTrades) * 100).toFixed(2) + '%' : '0%';
    const hoaRate = totalTrades > 0 ? ((hoaTrades / totalTrades) * 100).toFixed(2) + '%' : '0%';
    const hutRate = totalTrades > 0 ? ((hutTrades / totalTrades) * 100).toFixed(2) + '%' : '0%';

    // Tính tổng và trung bình R:R
    let totalRR = filteredTrades.reduce((sum, trade) => sum + parseFloat(trade.rrtt || 0), 0);
    totalRR = Math.abs(totalRR).toFixed(2);
    const averageRR = totalTrades > 0 ? (totalRR / totalTrades).toFixed(2) : '0';

    // Trả về thống kê tổng thể và thống kê chi tiết theo loại lệnh
    return {
        overallStats: {
            totalTrades: totalTrades,
            tpTrades: tpTrades,
            slTrades: slTrades,
            hoaTrades: hoaTrades,
            hutTrades: hutTrades,
            tpRate: tpRate,
            slRate: slRate,
            hoaRate: hoaRate,
            hutRate: hutRate,
            totalRR: totalRR,
            averageRR: averageRR
        },
        perOrderStats: loailenhList.map(loailenh => {
            // Lọc các giao dịch thuộc loại lệnh này
            const tradesByOrderType = filteredTrades.filter(trade => trade.loailenh === loailenh.id);

            const totalTradesByType = tradesByOrderType.length;
            const winTrades = tradesByOrderType.filter(trade => trade.sltp.toLowerCase() === 'tp').length;
            const loseTrades = tradesByOrderType.filter(trade => trade.sltp.toLowerCase() === 'sl').length;
            const hoaTrades = tradesByOrderType.filter(trade => trade.sltp.toLowerCase() === 'hoa').length;
            const hutTrades = tradesByOrderType.filter(trade => trade.sltp.toLowerCase() === 'hut').length;

            // Tính tỷ lệ thắng, thua, hòa, hụt cho từng loại lệnh
            const winRate = totalTradesByType > 0 ? ((winTrades / totalTradesByType) * 100).toFixed(2) : '0';
            const loseRate = totalTradesByType > 0 ? ((loseTrades / totalTradesByType) * 100).toFixed(2) : '0';
            const hoaRate = totalTradesByType > 0 ? ((hoaTrades / totalTradesByType) * 100).toFixed(2) : '0';
            const hutRate = totalTradesByType > 0 ? ((hutTrades / totalTradesByType) * 100).toFixed(2) : '0';

            // Tính RR trung bình cho loại lệnh này
            const totalRRByType = tradesByOrderType.reduce((sum, trade) => sum + parseFloat(trade.rrtt || 0), 0).toFixed(2);
            const averageRRByType = totalTradesByType > 0 ? (totalRRByType / totalTradesByType).toFixed(2) : '0';

            return {
                loailenhName: loailenh.name,
                totalTrades: totalTradesByType,
                winTrades: winTrades,
                loseTrades: loseTrades,
                hoaTrades: hoaTrades,
                hutTrades: hutTrades,
                winRate: winRate + '%',
                loseRate: loseRate + '%',
                hoaRate: hoaRate + '%',
                hutRate: hutRate + '%',
                totalRR: totalRRByType, // Thêm RR trung bình cho loại lệnh
                averageRR: averageRRByType // Thêm RR trung bình cho loại lệnh
            };
        })
    };
}

function displayStats(stats) { 
    // Lấy phần tử chứa toàn bộ danh sách thống kê để hiển thị
    const statsContainer = document.getElementById('displayStats');
    statsContainer.innerHTML = ''; // Xóa nội dung cũ trước khi thêm mới

    // Hiển thị tổng số giao dịch và tỷ lệ các loại 'tp', 'sl', 'hoa', 'hut'
    const overallStats = stats.overallStats;
    const totalElement = document.createElement('div');
    totalElement.classList.add('total-item'); // Thêm class để dễ dàng CSS

    // Tạo các phần tử cơ bản
    const totalTradesElement = document.createElement('p');
    totalTradesElement.innerHTML = `<strong>Tổng giao dịch: </strong> <span class="rate">${overallStats.totalTrades}</span>`;
    totalElement.appendChild(totalTradesElement);

    const tpTradesElement = document.createElement('p');
    tpTradesElement.innerHTML = `<strong>Thắng:</strong> ${overallStats.tpTrades} <span class="rate">${overallStats.tpRate}</span>`;
    totalElement.appendChild(tpTradesElement);

    const slTradesElement = document.createElement('p');
    slTradesElement.innerHTML = `<strong>Thua:</strong> ${overallStats.slTrades} <span class="rate">${overallStats.slRate}</span>`;
    totalElement.appendChild(slTradesElement);

    const hoaTradesElement = document.createElement('p');
    hoaTradesElement.innerHTML = `<strong>Hòa:</strong> ${overallStats.hoaTrades} <span class="rate">${overallStats.hoaRate}</span>`;
    totalElement.appendChild(hoaTradesElement);

    const hutTradesElement = document.createElement('p');
    hutTradesElement.innerHTML = `<strong>Hụt:</strong> ${overallStats.hutTrades} <span class="rate">${overallStats.hutRate}</span>`;
    totalElement.appendChild(hutTradesElement);

    // Kiểm tra nếu `sortSltp` là mảng và có độ dài bằng 3, xóa phần tử "Hụt"
    if (Array.isArray(sortSltp) && sortSltp.length === 3) {
        totalElement.removeChild(hutTradesElement);
    } else if (Array.isArray(sortSltp) && sortSltp.length === 2) {
        // xóa phần tử "Hòa" và "Hụt"
        totalElement.removeChild(hoaTradesElement);
        totalElement.removeChild(hutTradesElement);
    }

    // Thêm thông tin về Tổng RR và RR trung bình
    const totalRR = document.createElement('p');
    totalRR.innerHTML = `<strong>Tổng RR:</strong> <span class="rate">${overallStats.totalRR}</span>`;
    totalElement.appendChild(totalRR);

    const averageRR = document.createElement('p');
    averageRR.innerHTML = `<strong>RR trung bình:</strong> <span class="rate">${overallStats.averageRR}</span>`;
    totalElement.appendChild(averageRR);

    // Thêm `totalElement` vào `statsContainer`
    statsContainer.appendChild(totalElement);

    // Hiển thị thống kê theo từng loại lệnh
    stats.perOrderStats.forEach(stat => {
        // Tạo một thẻ div để chứa từng loại thống kê
        const statElement = document.createElement('div');
        statElement.classList.add('stat-item'); // Thêm class để dễ dàng CSS

        // Tạo các phần tử cho từng loại thống kê
        const loailenhNameElement = document.createElement('h3');
        loailenhNameElement.innerHTML = `<strong>${stat.loailenhName}</strong>`;
        statElement.appendChild(loailenhNameElement);

        const totalTradesStat = document.createElement('p');
        totalTradesStat.innerHTML = `<strong>Tổng giao dịch:</strong> <span class="rate">${stat.totalTrades}</span>`;
        statElement.appendChild(totalTradesStat);

        const winTradesStat = document.createElement('p');
        winTradesStat.innerHTML = `<strong>Thắng:</strong> ${stat.winTrades} <span class="rate">${stat.winRate}</span>`;
        statElement.appendChild(winTradesStat);

        const loseTradesStat = document.createElement('p');
        loseTradesStat.innerHTML = `<strong>Thua:</strong> ${stat.loseTrades} <span class="rate">${stat.loseRate}</span>`;
        statElement.appendChild(loseTradesStat);

        const hoaTradesStat = document.createElement('p');
        hoaTradesStat.innerHTML = `<strong>Hòa:</strong> ${stat.hoaTrades} <span class="rate">${stat.hoaRate}</span>`;
        statElement.appendChild(hoaTradesStat);

        const hutTradesStat = document.createElement('p');
        hutTradesStat.innerHTML = `<strong>Hụt:</strong> ${stat.hutTrades} <span class="rate">${stat.hutRate}</span>`;
        statElement.appendChild(hutTradesStat);

        // Kiểm tra nếu `sortSltp` là mảng và có độ dài bằng 3, xóa phần tử "Hụt"
        if (Array.isArray(sortSltp) && sortSltp.length === 3) {
            statElement.removeChild(hutTradesStat);
        } else if (Array.isArray(sortSltp) && sortSltp.length === 2) {
            // xóa phần tử "Hòa" và "Hụt"
            statElement.removeChild(hoaTradesStat);
            statElement.removeChild(hutTradesStat);
        }

        const totalRRStat = document.createElement('p');
        totalRRStat.innerHTML = `<strong>Tổng RR:</strong> <span class="rate">${stat.totalRR}</span>`;
        statElement.appendChild(totalRRStat);

        const averageRRStat = document.createElement('p');
        averageRRStat.innerHTML = `<strong>RR trung bình:</strong> <span class="rate">${stat.averageRR}</span>`;
        statElement.appendChild(averageRRStat);

        // Thêm `statElement` vào `statsContainer`
        statsContainer.appendChild(statElement);
    });
}

// Hàm hiển thị một hàng giao dịch vào bảng
function renderTradeRow(trade, index, currentPage, rowsPerPage) {
    // Nếu sắp xếp ASC, STT tăng dần
    let rowIndex;
    if (sortOrder === 'asc') {
        rowIndex = (currentPage - 1) * rowsPerPage + index + 1;
    } else {
        // Nếu sắp xếp DESC, STT giảm dần
        // Tính STT từ cuối lên
        rowIndex = totalTrades - ((currentPage - 1) * rowsPerPage + index);
    }

    const row = document.createElement('tr');
    const sltpResult = trade.sltp.toLowerCase();
    
    // Xác định màu sắc cho SL/TP
    const sltpColor = sltpResult === 'sl' ? 'indianred' : (sltpResult === 'tp' ? 'lightgreen' : (sltpResult === 'hoa' ? 'yellow' : 'orange'));
    
    // Xác định màu sắc và trạng thái selected cho buy/sell
    const buysellColor = trade.buysell.toLowerCase() === 'buy' ? 'lightgreen' : 'indianred';

    // Tạo phần <select> với tùy chọn cho thể loại
    const loailenhSelectHTML = `
        <select data-field="loailenh" style="border: none;">
            <option value="">---</option>
            ${loailenhList.map(loailenh => `
                <option value="${loailenh.id}" ${String(loailenh.id) === String(trade.loailenh) ? 'selected' : ''}>${loailenh.name}</option>
            `).join('')}
        </select>
    `;

    // Thiết lập màu nền cho hàng
    const backgroundColor = (index % 2 === 0) ? '#fff' : '#fafafa'; // Màu nền xen kẽ
    row.style.backgroundColor = backgroundColor; // Gán màu nền cho hàng

    row.innerHTML = `
        <td>${rowIndex}</td>
        <td contenteditable="true" data-field="date">${trade.date}</td>
        <td contenteditable="true" data-field="pair">${trade.pair}</td>
        <td contenteditable="true" data-field="rr">${trade.rr}</td>
        <td>
            <select data-field="buysell" style="background-color: ${buysellColor};">
                <option value="buy" ${trade.buysell === 'buy' ? 'selected' : ''}>Buy</option>
                <option value="sell" ${trade.buysell === 'sell' ? 'selected' : ''}>Sell</option>
            </select>
        </td>
        <td>
            <select data-field="sltp" style="background-color: ${sltpColor};">
                <option value="sl" ${trade.sltp === 'sl' ? 'selected' : ''}>SL</option>
                <option value="tp" ${trade.sltp === 'tp' ? 'selected' : ''}>TP</option>
                <option value="hoa" ${trade.sltp === 'hoa' ? 'selected' : ''}>Hoà</option>
                <option value="hut" ${trade.sltp === 'hut' ? 'selected' : ''}>Hụt</option>
            </select>
        </td>
        <td contenteditable="true" data-field="rrtt">${trade.rrtt}</td>
        <td style="text-align: center;">
            <div style="display: flex; justify-content: center; align-items: center;">
                <span contenteditable="true" data-field="anh">${trade.anh}</span>
                ${trade.anh ? `<button style="margin-left: 10px;" class="view-img-btn" data-url="${trade.anh}">Xem</button>` : ''}
            </div>
        </td>
        <td>${loailenhSelectHTML}</td>
        <td contenteditable="true" data-field="khung">${trade.khung}</td>
        <td contenteditable="true" data-field="ghichu">${trade.ghichu}</td>
        <td>
            <button class="delete-btn" data-id="${trade.id}">Xoá</button>
        </td>
    `;

    // Gán sự kiện xóa cho nút Xoá với cảnh báo
    row.querySelector('.delete-btn').addEventListener('click', function() {
        const confirmDelete = window.confirm("Bạn có chắc chắn muốn xoá giao dịch này không?");
        if (confirmDelete) {
            deleteTrade(`trade_${trade.id}`); // Thực hiện xóa nếu người dùng đồng ý
        }
    });

    // Gán sự kiện `blur` cho các ô có thể chỉnh sửa
    row.querySelectorAll('[contenteditable="true"]').forEach(cell => {
        cell.addEventListener('blur', function() {
            const field = cell.getAttribute('data-field');
            let value = cell.textContent.trim();
            
            // Kiểm tra nếu field là 'rrtt' hoặc 'rr' và chuyển đổi dấu phẩy thành dấu chấm
            if (field === 'rrtt' || field === 'rr') {
                value = value.replace(',', '.'); // Thay dấu phẩy bằng dấu chấm
                value = parseFloat(value); // Chuyển giá trị thành số
                if (isNaN(value)) { // Kiểm tra nếu giá trị không phải là số
                    value = ''; // Nếu không phải là số hợp lệ, gán là chuỗi rỗng
                }
            }
            
            updateTrade(`trade_${trade.id}`, field, value); // Gọi hàm cập nhật với key và field
        });
    });

    // Thêm sự kiện mở hình ảnh ở tab mới
    const viewImgBtn = row.querySelector('.view-img-btn');
    if (viewImgBtn) { // Kiểm tra nếu nút tồn tại
        viewImgBtn.addEventListener('click', function() {
            const imgUrl = this.dataset.url; // Lấy URL từ data attribute
            window.open(imgUrl, '_blank'); // Mở hình ảnh ở tab mới
        });
    }

    // Gán sự kiện `change` cho phần tử <select> của loại lệnh
    const selectLoailenh = row.querySelector('select[data-field="loailenh"]');
    selectLoailenh.addEventListener('change', function() {
        const value = selectLoailenh.value; // Lấy giá trị đã chọn
        updateTrade(`trade_${trade.id}`, 'loailenh', value); // Gọi hàm cập nhật với field 'loailenh'
    });

    // Gán sự kiện `change` cho phần tử <select> của buy/sell
    const selectBuysell = row.querySelector('select[data-field="buysell"]');
    selectBuysell.addEventListener('change', function() {
        const value = selectBuysell.value; // Lấy giá trị đã chọn
        updateTrade(`trade_${trade.id}`, 'buysell', value); // Gọi hàm cập nhật với field 'buysell'
        
        // Thay đổi màu nền tùy theo giá trị
        if (value === 'buy') {
            selectBuysell.style.backgroundColor = 'lightgreen';  // Màu nền cho Buy
        } else if (value === 'sell') {
            selectBuysell.style.backgroundColor = 'indianred';    // Màu nền cho Sell
        } else {
            selectBuysell.style.backgroundColor = '';       // Màu nền mặc định nếu không phải Buy/Sell
        }
    });

    // Gán sự kiện `change` cho phần tử <select> của buy/sell
    const selectSltp = row.querySelector('select[data-field="sltp"]');
    selectSltp.addEventListener('change', function() {
        const value = selectSltp.value; // Lấy giá trị đã chọn
        updateTrade(`trade_${trade.id}`, 'sltp', value); // Gọi hàm cập nhật với field 'buysell'
        // Thay đổi màu nền tùy theo giá trị
        if (value === 'sl') {
            selectSltp.style.backgroundColor = 'indianred';  // Màu nền cho Buy
        } else if (value === 'tp') {
            selectSltp.style.backgroundColor = 'lightgreen';    // Màu nền cho Sell
        } else if (value === 'hoa') {
            selectSltp.style.backgroundColor = 'yellow';    // Màu nền cho Sell
        } else {
            selectSltp.style.backgroundColor = 'orange';       // Màu nền mặc định nếu không phải Buy/Sell
        }
    });

    return row;
}

// Hàm hiển thị danh sách giao dịch đã lọc vào bảng
function renderTradesTable(filteredTrades) {
    const tradesBody = document.getElementById('tradesBody');
    tradesBody.innerHTML = ''; // Xóa nội dung hiện tại

    filteredTrades.forEach((trade, index) => {
        tradesBody.appendChild(renderTradeRow(trade, index, currentPage, rowsPerPage)); // Thêm từng hàng giao dịch
    });
}

function loadTradeStats(orderType = '') {
    getAllTrades(sortBy, sortOrder, sortMonth, sortYear, sortSltp, trades => {
        const filteredTrades = filterTradesByOrderType(orderType, trades);

        // Tính toán và hiển thị thống kê
        const statsCalculate = calculateStats(filteredTrades);
        displayStats(statsCalculate);

        totalTrades = filteredTrades.length;

        // Phân trang
        const paginatedTrades = paginateTrades(filteredTrades);
        renderTradesTable(paginatedTrades);

        // Hiển thị các trang
        const { startPage, endPage, totalPagesAvailable } = getPageRange(filteredTrades);
        renderPagination(startPage, endPage, totalPagesAvailable);
    });
}

function getPageRange(totalTrades) {
    const totalPagesAvailable = Math.ceil(totalTrades.length / rowsPerPage);
    const startPage = Math.max(1, currentPage - Math.floor(totalPages / 2));
    const endPage = Math.min(startPage + totalPages - 1, totalPagesAvailable);

    return {
        startPage,
        endPage,
        totalPagesAvailable
    };
}

// Hàm phân trang
function paginateTrades(trades) {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return trades.slice(startIndex, endIndex);
}

// Hàm chuyển trang
function nextPage(trades) {
    if (currentPage * rowsPerPage < trades.length) {
        currentPage++;
        renderTradesTable(paginateTrades(trades));
    }
}

function previousPage(trades) {
    if (currentPage > 1) {
        currentPage--;
        renderTradesTable(paginateTrades(trades));
    }
}

function renderPagination(startPage, endPage, totalPagesAvailable) {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = ''; // Xóa nội dung hiện tại

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.disabled = (i === currentPage); // Vô hiệu hóa nút trang hiện tại
        pageButton.addEventListener('click', () => {
            currentPage = i;
            loadTradeStats(document.getElementById('duan').value); // Tải lại dữ liệu
        });
        paginationContainer.appendChild(pageButton);
    }

    // Thêm nút chuyển trang
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Trang trước';
    prevButton.disabled = currentPage === 1; // Vô hiệu hóa nếu đang ở trang đầu
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadTradeStats(document.getElementById('duan').value);
        }
    });
    paginationContainer.appendChild(prevButton);

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Trang sau';
    nextButton.disabled = currentPage * rowsPerPage >= totalPagesAvailable * rowsPerPage; // Vô hiệu hóa nếu đang ở trang cuối
    nextButton.addEventListener('click', () => {
        if (currentPage * rowsPerPage < totalPagesAvailable * rowsPerPage) {
            currentPage++;
            loadTradeStats(document.getElementById('duan').value);
        }
    });
    paginationContainer.appendChild(nextButton);
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

// Hàm xử lý sự kiện click
function handleSort(headerId, sortField) {
    document.getElementById(headerId).addEventListener('click', function() {
        sortBy = sortField;
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'; // Đảo ngược thứ tự
        loadTradeStats(document.getElementById('duan').value); // Tải lại thống kê giao dịch
    });
}

// Đăng ký sự kiện cho các tiêu đề
handleSort('header-stt', 'id');
handleSort('header-date', 'date');
handleSort('header-pair', 'pair');
handleSort('header-rr', 'rr');
handleSort('header-rrtt', 'rrtt');
handleSort('header-buysell', 'buysell');
handleSort('header-sltp', 'sltp');
handleSort('header-loailenh', 'loailenh');
handleSort('header-khung', 'khung');

// Thêm sự kiện cho nút "Add Trade"
document.getElementById('addTradeBtn').addEventListener('click', addTrade);
document.getElementById('date').addEventListener('input', formatDateTimeInput);

// Thêm sự kiện cho dropdown thể loại
document.getElementById('duan').addEventListener('change', function() {
    const selectedDuan = this.value;

    // Kiểm tra xem có chọn thể loại nào không
    if (selectedDuan) {
        loadTradeStats(selectedDuan); // Lọc giao dịch
        chrome.storage.local.set({ setting_duanlastId: selectedDuan }, () => {
            console.log('Đã lưu ID thể loại cuối cùng được chọn:', selectedDuan);
        });
    } else {
        loadTradeStats();
        console.log('Không có thể loại nào được chọn');
    }
});

document.getElementById('sortFilter').addEventListener('click', function() {
    sortMonth = null;
    sortYear = null;
    sortSltp = null;
    // Lấy giá trị tháng/năm từ input (giả sử input là một chuỗi "2/2024")
    const monthYearInput = document.getElementById('monthYearInput').value;

    if (monthYearInput) {
        const [inputMonth, inputYear] = monthYearInput.split('/');  // Tách chuỗi '2/2024' thành [2, 2024]
        sortMonth = parseInt(inputMonth, 10);  // Chuyển tháng thành số
        sortYear = parseInt(inputYear, 10);   // Chuyển năm thành số
    }

    // Lấy giá trị từ select SL/TP
    const sortSltpInput = document.getElementById('sltpSelect').value;

    // Nếu chọn "onlyWinLoss", gán sortSltp là một mảng ['tp', 'sl']
    if (sortSltpInput === "onlyWinLoss") {
        sortSltp = ['tp', 'sl'];
    } else if (sortSltpInput === "onlyWinLossDraw") {
        sortSltp = ['tp', 'sl', 'hoa'];
    } else if (sortSltpInput) {
        // Nếu có giá trị khác, chỉ gán giá trị đơn
        sortSltp = [sortSltpInput];
    }

    // Gọi lại hàm loadTradeStats với các giá trị đã lọc
    loadTradeStats(document.getElementById('duan').value); // Truyền đối số là một đối tượng chứa các tham số lọc
});


// Hàm để tải dữ liệu khi trang được mở
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Tải danh sách thể loại và lưu vào duanList
        await loadDuanData();
        await loadLoailenhData();

        chrome.storage.local.get(['hnbacktest_setting'], function(result) {
            const settings = result.hnbacktest_setting || {};

            // Cập nhật giá trị của rowsPerPage nếu có trong settings, nếu không giữ giá trị mặc định
            rowsPerPage = settings.PerPage !== undefined ? settings.PerPage : rowsPerPage;

            // Cập nhật giá trị của sortOrder nếu có trong settings, nếu không giữ giá trị mặc định
            sortOrder = settings.sortOrder !== undefined ? settings.sortOrder : sortOrder;

            console.log('Rows Per Page:', rowsPerPage);  // Kiểm tra giá trị rowsPerPage
            console.log('Sort Order:', sortOrder);      // Kiểm tra giá trị sortOrder
        });

        // Lấy ID thể loại cuối cùng được chọn, hoặc gán mặc định là ''
        chrome.storage.local.get('setting_duanlastId', data => {
            const duanLastId = data.setting_duanlastId || '';

            // Tải dữ liệu thống kê và hiển thị các lựa chọn thể loại
            loadTradeStats(duanLastId);
            loadDuanOptions(duanLastId);
            loadLoailenhOptions();
        });

    } catch (error) {
        console.error('Lỗi khi tải danh sách thể loại:', error);
    }
});
