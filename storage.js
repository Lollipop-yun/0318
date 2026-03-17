document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. 本地存储数据恢复系统 (核心功能)
    // ==========================================
    // 恢复文字
    document.querySelectorAll('.editable-text').forEach(el => {
        if (el.id && localStorage.getItem(el.id)) {
            el.innerText = localStorage.getItem(el.id);
        }
    });
    // 恢复图片
    document.querySelectorAll('.editable-img').forEach(el => {
        if (el.id && localStorage.getItem(el.id)) {
            el.style.backgroundImage = `url(${localStorage.getItem(el.id)})`;
            el.style.backgroundSize = 'cover'; 
            el.style.backgroundPosition = 'center';
            el.classList.add('has-image');
        }
    });

    // ==========================================
    // 2. 图片无痕压缩与本地保存
    // ==========================================
    const uploader = document.getElementById('imageUploader');
    let currentTargetImg = null;

    if(uploader) {
        document.querySelectorAll('.editable-img').forEach(el => {
            el.addEventListener('click', (e) => { 
                currentTargetImg = e.target; 
                uploader.click(); 
            });
        });

        uploader.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_SIZE = 400; 
                        let width = img.width; 
                        let height = img.height;
                        if (width > height && width > MAX_SIZE) { 
                            height *= MAX_SIZE / width; width = MAX_SIZE; 
                        } else if (height > MAX_SIZE) { 
                            width *= MAX_SIZE / height; height = MAX_SIZE; 
                        }
                        canvas.width = width; canvas.height = height;
                        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

                        currentTargetImg.style.backgroundImage = `url(${dataUrl})`;
                        currentTargetImg.style.backgroundSize = 'cover'; 
                        currentTargetImg.style.backgroundPosition = 'center';
                        currentTargetImg.classList.add('has-image');

                        if (currentTargetImg.id) {
                            try { localStorage.setItem(currentTargetImg.id, dataUrl); } 
                            catch (err) { console.warn("存储已满，静默跳过"); }
                        }
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
            e.target.value = '';
        });
    }

    // ==========================================
    // 3. 弹窗文字修改与本地保存
    // ==========================================
    const textModal = document.getElementById('textModal');
    const modalInput = document.getElementById('modalInput');
    let currentTextTarget = null;

    if (textModal && modalInput) {
        const openModal = (element) => {
            currentTextTarget = element; 
            modalInput.value = element.innerText;
            textModal.classList.add('show'); 
            setTimeout(() => modalInput.focus(), 100);
        };
        const closeModal = () => { textModal.classList.remove('show'); currentTextTarget = null; };

        document.querySelectorAll('.editable-text').forEach(el => { 
            el.addEventListener('click', (e) => openModal(e.target)); 
        });
        
        document.getElementById('btnCancel').addEventListener('click', closeModal);
        document.getElementById('btnConfirm').addEventListener('click', () => {
            if (currentTextTarget) {
                currentTextTarget.innerText = modalInput.value;
                if (currentTextTarget.id) localStorage.setItem(currentTextTarget.id, modalInput.value);
            }
            closeModal();
        });
        textModal.addEventListener('click', (e) => { if (e.target === textModal) closeModal(); });
    }

    // ==========================================
    // 4. 实时环境物理数据接管 (不可篡改)
    // ==========================================
    // 4.1 日期同步
    const dateEl = document.getElementById('p2-txt-date');
    if (dateEl) {
        const now = new Date();
        dateEl.innerText = (now.getMonth() + 1) + '月' + now.getDate() + '日';
    }

    // 4.2 iOS状态栏时间同步
    function updateSysTime() {
        const t = new Date();
        const h = String(t.getHours()).padStart(2, '0');
        const m = String(t.getMinutes()).padStart(2, '0');
        const timeEl = document.getElementById('sys-time');
        if (timeEl) timeEl.textContent = `${h}:${m}`;
    }
    setInterval(updateSysTime, 1000); updateSysTime();

    // 4.3 真实电量同步
    const batteryWidgetEl = document.getElementById('p1-txt-bat-val');
    const sysBatFill = document.getElementById('sys-battery-fill');
    const updateBatteryUI = (level, isCharging) => {
        if (batteryWidgetEl) batteryWidgetEl.innerText = level + '%';
        if (sysBatFill) {
            sysBatFill.style.width = level + '%';
            if (isCharging) sysBatFill.classList.add('charging'); 
            else sysBatFill.classList.remove('charging');
        }
    };
    if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
            const onChange = () => updateBatteryUI(Math.round(battery.level * 100), battery.charging);
            onChange(); battery.addEventListener('levelchange', onChange); battery.addEventListener('chargingchange', onChange); 
        });
    } else {
        if (batteryWidgetEl) batteryWidgetEl.innerText = '80%';
        if (sysBatFill) sysBatFill.style.width = '80%';
    }

    // 4.4 真实地理位置气象同步
    const weatherCodes = {
        0: '晴', 1: '晴', 2: '多云', 3: '阴',
        45: '雾', 48: '雾', 51: '小雨', 53: '中雨', 55: '大雨',
        61: '小雨', 63: '中雨', 65: '大雨', 71: '小雪', 73: '中雪', 75: '大雪', 95: '雷阵雨'
    };
    function fetchRealWeather(lat, lon) {
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
            .then(res => res.json())
            .then(data => { 
                const tempStr = Math.round(data.current_weather.temperature) + '°';
                const el1 = document.getElementById('p1-txt-temp-val');
                const el2 = document.getElementById('p2-txt-temp-val');
                if (el1) el1.innerText = tempStr;
                if (el2) el2.innerText = tempStr;
                
                const code = data.current_weather.weathercode;
                const descEl = document.getElementById('p2-txt-weather-desc');
                if(descEl) descEl.innerText = weatherCodes[code] || '晴';
            })
            .catch(() => fallbackWeather()); 
    }
    function fallbackWeather() {
        const el1 = document.getElementById('p1-txt-temp-val');
        const el2 = document.getElementById('p2-txt-temp-val');
        if (el1) el1.innerText = '16°'; 
        if (el2) el2.innerText = '16°';
    }
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => fetchRealWeather(position.coords.latitude, position.coords.longitude),
            error => fetchRealWeather(35.6895, 139.6917) // 失败默认日本东京
        );
    } else {
        fetchRealWeather(35.6895, 139.6917);
    }
});