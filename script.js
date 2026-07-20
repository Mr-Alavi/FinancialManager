document.addEventListener("DOMContentLoaded", () => {
    const splashScreen = document.getElementById("splash-screen");
    const mainContent = document.getElementById("main-content");

    // محو کردن صفحه ورود بعد از ۴ ثانیه
    setTimeout(() => {
        splashScreen.style.opacity = "0";
        
        setTimeout(() => {
            splashScreen.style.display = "none";
            mainContent.classList.remove("hidden");
        }, 1000); // صبر برای اتمام انیمیشن محو شدن
        
    }, 4000); // مدت زمان نمایش صفحه نئونی
});

function openSection(id) {
    // اینجا کدهای مربوط به باز شدن صفحه هر بخش قرار می‌گیره
    alert("Opening section: " + id);
}
