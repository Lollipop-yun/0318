// activation.js
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('activation-overlay');
    const tabLogin = document.getElementById('tab-login');
    const tabReg = document.getElementById('tab-register');
    const inputCode = document.getElementById('input-code');
    const inputUser = document.getElementById('input-user');
    const inputPass = document.getElementById('input-pass');
    const btnSubmit = document.getElementById('btn-auth-submit');
    const errorText = document.getElementById('auth-error-msg');

    let isLoginMode = false;

    // --- 算法核心：简单的哈希加密生成校验 (防破解) ---
    const SECRET_SALT = "LINDONG_WINTER_2026";
    
    function generateHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0; 
        }
        return Math.abs(hash).toString(36).substring(0, 4).toUpperCase().padStart(4, '0');
    }

    function verifyActivationCode(code) {
        // 格式需为: winter-XXXX-YYYY
        const parts = code.trim().split('-');
        if (parts.length !== 3 || parts[0] !== 'winter') return false;
        const randomPart = parts[1];
        const signaturePart = parts[2];
        // 校验算法：第二段是否为 (第一段+盐) 的哈希值
        const expectedSignature = generateHash(randomPart + SECRET_SALT);
        return signaturePart === expectedSignature;
    }

    // --- 模拟跨浏览器云端数据库 ---
    // （注：因为纯前端没有真实数据库，此处借用 localStorage 构建本地伪数据库。
    // 在真实商业环境中，只需将这里的逻辑替换为 fetch() 发送给后端验证即可。）
    function getDB() {
        return JSON.parse(localStorage.getItem('LINDONG_USERS_DB') || '{}');
    }
    function saveDB(db) {
        localStorage.setItem('LINDONG_USERS_DB', JSON.stringify(db));
    }
    function getUsedCodes() {
        return JSON.parse(localStorage.getItem('LINDONG_USED_CODES') || '[]');
    }
    function markCodeUsed(code) {
        const used = getUsedCodes();
        used.push(code);
        localStorage.setItem('LINDONG_USED_CODES', JSON.stringify(used));
    }

    // --- 检查是否已经登录 ---
    const currentUser = localStorage.getItem('LINDONG_CURRENT_USER');
    if (currentUser) {
        overlay.classList.add('hidden');
        setTimeout(() => overlay.style.display = 'none', 400); // 登录成功则移除遮罩
        return; // 结束执行
    }

    // --- UI 切换逻辑 ---
    function switchMode(loginMode) {
        isLoginMode = loginMode;
        errorText.innerText = '';
        if (loginMode) {
            tabLogin.classList.add('active');
            tabReg.classList.remove('active');
            inputCode.style.display = 'none';
            btnSubmit.innerText = '登 录';
        } else {
            tabReg.classList.add('active');
            tabLogin.classList.remove('active');
            inputCode.style.display = 'block';
            btnSubmit.innerText = '绑 定 激 活';
        }
    }

    tabLogin.addEventListener('click', () => switchMode(true));
    tabReg.addEventListener('click', () => switchMode(false));

    // --- 提交验证逻辑 ---
    btnSubmit.addEventListener('click', () => {
        const user = inputUser.value.trim();
        const pass = inputPass.value.trim();
        const code = inputCode.value.trim();

        if (!user || !pass) {
            errorText.innerText = '请输入账号和密码';
            return;
        }

        const db = getDB();

        if (isLoginMode) {
            // 登录逻辑
            if (db[user] && db[user] === generateHash(pass + "PWD")) {
                localStorage.setItem('LINDONG_CURRENT_USER', user);
                location.reload(); // 登录成功刷新进入
            } else {
                errorText.innerText = '账号或密码错误';
            }
        } else {
            // 注册激活逻辑
            if (!code) {
                errorText.innerText = '请输入激活码';
                return;
            }
            if (db[user]) {
                errorText.innerText = '该账号已被注册';
                return;
            }
            if (getUsedCodes().includes(code)) {
                errorText.innerText = '该激活码已被使用失效';
                return;
            }
            if (!verifyActivationCode(code)) {
                errorText.innerText = '无效的激活码格式或密码';
                return;
            }

            // 激活成功，绑定账密，销毁激活码
            db[user] = generateHash(pass + "PWD"); // 存储密码哈希
            saveDB(db);
            markCodeUsed(code);
            localStorage.setItem('LINDONG_CURRENT_USER', user);
            
            errorText.style.color = 'var(--ios-green)';
            errorText.innerText = '激活成功，正在进入...';
            setTimeout(() => location.reload(), 800);
        }
    });
});
