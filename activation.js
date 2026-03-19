// activation.js
document.addEventListener('DOMContentLoaded', () => {
    const authScreen = document.getElementById('auth-screen');
    const mainOs = document.getElementById('main-os');
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    const authBtn = document.getElementById('auth-btn');
    
    const inputUser = document.getElementById('input-user');
    const inputPass = document.getElementById('input-pass');
    const inputCode = document.getElementById('input-code');

    // 核心加密盐（千万不要改动，否则生成的激活码会全部失效）
    const SECRET = "LINDONG_OS_2026_SECRET_SALT";

    // 检查是否已经绑定账密
    const savedUser = localStorage.getItem('sys_account');
    const savedPass = localStorage.getItem('sys_password');

    if (savedUser && savedPass) {
        // 进入【登录模式】
        authTitle.innerText = "欢迎回来";
        authSubtitle.innerText = "请输入绑定的账号密码进入系统";
        inputCode.style.display = "none"; // 隐藏激活码输入框
        authBtn.innerText = "登 录";
        
        authBtn.addEventListener('click', () => {
            if (inputUser.value.trim() === savedUser && inputPass.value.trim() === savedPass) {
                enterSystem();
            } else {
                alert("账号或密码错误！");
            }
        });
    } else {
        // 进入【首次激活模式】
        authTitle.innerText = "系统激活";
        authSubtitle.innerText = "首次使用请设置账密并输入激活码";
        authBtn.innerText = "激 活 并 绑 定";

        authBtn.addEventListener('click', () => {
            const user = inputUser.value.trim();
            const pass = inputPass.value.trim();
            const code = inputCode.value.trim();

            if (!user || !pass || !code) {
                alert("请填写完整的信息！"); return;
            }

            if (verifyCode(code)) {
                // 检查该激活码是否已在本地被标记为失效
                let usedCodes = JSON.parse(localStorage.getItem('sys_used_codes') || '[]');
                if (usedCodes.includes(code)) {
                    alert("该激活码已被使用，已失效！"); return;
                }
                
                // 激活成功，绑定数据
                usedCodes.push(code);
                localStorage.setItem('sys_used_codes', JSON.stringify(usedCodes));
                localStorage.setItem('sys_account', user);
                localStorage.setItem('sys_password', pass);
                
                alert("激活成功！账号密码已绑定。");
                enterSystem();
            } else {
                alert("无效的激活码，请检查！");
            }
        });
    }

    function enterSystem() {
        authScreen.style.display = "none";
        mainOs.style.display = "block";
    }

    // 激活码验证算法
    function verifyCode(code) {
        const regex = /^winter-([A-Z0-9]{4})-([A-Z0-9]{4})$/i;
        const match = code.match(regex);
        if (!match) return false;
        
        const part1 = match[1].toUpperCase();
        const part2 = match[2].toUpperCase();
        
        // 验证逻辑：第一段 + 盐 经过哈希计算后，必须等于第二段
        return generateHash(part1 + SECRET) === part2;
    }

    // 核心 Hash 算法 (利用位移计算，不可逆推)
    function generateHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
        }
        return (hash >>> 0).toString(16).toUpperCase().padStart(4, '0').slice(-4);
    }
});
