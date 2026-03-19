// activation.js - 激活码算法与账号绑定逻辑
document.addEventListener('DOMContentLoaded', () => {
    const authOverlay = document.getElementById('auth-overlay');
    const mainApp = document.getElementById('main-app');
    
    // 检查是否已经存在激活过的账号登录态
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        authOverlay.style.display = 'none';
        mainApp.style.display = 'block';
        return; // 已登录，直接放行
    }

    // DOM 元素绑定
    const tabLogin = document.getElementById('tab-login');
    const tabReg = document.getElementById('tab-reg');
    const formLogin = document.getElementById('form-login');
    const formReg = document.getElementById('form-reg');
    const msgEl = document.getElementById('auth-msg');

    // 切换标签页
    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active'); tabReg.classList.remove('active');
        formLogin.classList.add('active'); formReg.classList.remove('active');
        msgEl.innerText = '';
    });
    tabReg.addEventListener('click', () => {
        tabReg.classList.add('active'); tabLogin.classList.remove('active');
        formReg.classList.add('active'); formLogin.classList.remove('active');
        msgEl.innerText = '';
    });

    // 激活码防破解核心算法 (校验 winter-XXXX-YYYY)
    const SECRET_SALT = "LINDONG_2026_KEY";
    function verifyActivationCode(code) {
        if (!code || !code.startsWith("winter-")) return false;
        const parts = code.split("-");
        if (parts.length !== 3) return false;
        const part1 = parts[1];
        const part2 = parts[2];
        
        // 计算 Part1 的 Hash 以比对 Part2
        let hash = 0;
        const str = part1 + SECRET_SALT;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0; 
        }
        const expectedPart2 = Math.abs(hash).toString(36).substring(0, 4).padStart(4, '0');
        return expectedPart2 === part2;
    }

    // 注册与绑定激活码
    document.getElementById('btn-reg').addEventListener('click', () => {
        const user = document.getElementById('reg-user').value.trim();
        const pass = document.getElementById('reg-pass').value.trim();
        const code = document.getElementById('reg-code').value.trim();

        if (!user || !pass || !code) return msgEl.innerText = "请填写完整信息";
        
        // 校验账号是否已存在
        const users = JSON.parse(localStorage.getItem('sysUsers') || '{}');
        if (users[user]) return msgEl.innerText = "该账号已被注册";

        // 校验激活码是否合法
        if (!verifyActivationCode(code)) return msgEl.innerText = "激活码无效或格式错误";

        // 校验激活码是否已被使用
        const usedCodes = JSON.parse(localStorage.getItem('usedCodes') || '[]');
        if (usedCodes.includes(code)) return msgEl.innerText = "该激活码已被其他账号绑定";

        // 注册成功：保存账密，废弃激活码
        users[user] = pass; 
        localStorage.setItem('sysUsers', JSON.stringify(users));
        usedCodes.push(code);
        localStorage.setItem('usedCodes', JSON.stringify(usedCodes));

        // 自动登录
        localStorage.setItem('currentUser', user);
        enterPhone();
    });

    // 登录逻辑
    document.getElementById('btn-login').addEventListener('click', () => {
        const user = document.getElementById('log-user').value.trim();
        const pass = document.getElementById('log-pass').value.trim();
        
        if (!user || !pass) return msgEl.innerText = "请输入账号和密码";

        const users = JSON.parse(localStorage.getItem('sysUsers') || '{}');
        if (users[user] === pass) {
            localStorage.setItem('currentUser', user);
            enterPhone();
        } else {
            msgEl.innerText = "账号或密码错误";
        }
    });

    function enterPhone() {
        msgEl.style.color = '#34C759';
        msgEl.innerText = "验证成功，正在进入...";
        setTimeout(() => {
            authOverlay.style.opacity = '0';
            setTimeout(() => {
                authOverlay.style.display = 'none';
                mainApp.style.display = 'block';
            }, 400);
        }, 500);
    }
});
