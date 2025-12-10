function handleTimelineAnimation(){const e=document.querySelector(".experience-timeline"),t=document.querySelector(".timeline-fill");if(!e||!t)return;const n=()=>{const n=e.getBoundingClientRect(),o=window.innerHeight,s=n.top+window.scrollY-o/2,r=n.height,i=window.scrollY;let l=0;i>s&&(l=(i-s)/r*100),l=Math.min(100,Math.max(0,l)),t.style.height=`${l}%`};let o=!1;window.addEventListener("scroll",()=>{o||(window.requestAnimationFrame(()=>{n(),o=!1}),o=!0)}),n()}function updateTimelineFill(){const e=document.querySelector(".timeline-fill"),t=document.querySelector(".experience-timeline");if(e&&t){const n=t.getBoundingClientRect(),o=window.innerHeight;if(n.top<o&&n.bottom>0){const t=Math.max(0,Math.min(1,(o-n.top)/(o+n.height)));e.style.height=100*t+"%"}}}document.addEventListener("DOMContentLoaded",e=>{const mobileMenuToggle=document.getElementById("mobile-menu-toggle"),mainNav=document.getElementById("main-nav");if(mobileMenuToggle&&mainNav){mobileMenuToggle.addEventListener("click",()=>{mobileMenuToggle.classList.toggle("active"),mainNav.classList.toggle("active")});const navLinks=mainNav.querySelectorAll("a");navLinks.forEach(link=>{link.addEventListener("click",()=>{mobileMenuToggle.classList.remove("active"),mainNav.classList.remove("active")})});document.addEventListener("click",event=>{mobileMenuToggle.contains(event.target)||mainNav.contains(event.target)||(mobileMenuToggle.classList.remove("active"),mainNav.classList.remove("active"))})}const t=document.getElementById("preloader");if(t){const e=()=>{t.style.opacity="0",t.style.pointerEvents="none",setTimeout(()=>{t.style.display="none"},200)};requestAnimationFrame(e),window.addEventListener("load",e,{once:!0}),setTimeout(e,1500)}const n=document.querySelector(".cursor-dot"),o=document.querySelector(".cursor-outline");if(n&&o){let e=0,t=0,s=0,r=0;document.addEventListener("mousemove",function(o){e=o.clientX,t=o.clientY,n.style.left=e+"px",n.style.top=t+"px"}),function n(){s+=.1*(e-s),r+=.1*(t-r),o.style.left=s+"px",o.style.top=r+"px",requestAnimationFrame(n)}();document.querySelectorAll("a, button, .project-card-enhanced").forEach(e=>{e.addEventListener("mouseenter",()=>{n.style.transform="translate(-50%, -50%) scale(1.5)",o.style.transform="translate(-50%, -50%) scale(1.5)"}),e.addEventListener("mouseleave",()=>{n.style.transform="translate(-50%, -50%) scale(1)",o.style.transform="translate(-50%, -50%) scale(1)"})})}const s=document.querySelector(".progress-wrap");if(s){const e=s.querySelector("path");if(e){const t=e.getTotalLength();e.style.transition="none",e.style.WebkitTransition="none",e.style.strokeDasharray=`${t} ${t}`,e.style.strokeDashoffset=t,e.getBoundingClientRect(),e.style.transition="stroke-dashoffset 10ms linear",e.style.WebkitTransition="stroke-dashoffset 10ms linear";const n=50,o=()=>{const o=window.pageYOffset,r=document.documentElement.scrollHeight-window.innerHeight,i=t-o*t/r;e.style.strokeDashoffset=i,window.pageYOffset>n?s.classList.add("active-progress"):s.classList.remove("active-progress")};o(),window.addEventListener("scroll",o)}s.addEventListener("click",e=>(e.preventDefault(),window.scrollTo({top:0,behavior:"smooth"}),!1))}const r=document.querySelector(".nav-toggle"),i=document.querySelector("nav ul");r&&i&&r.addEventListener("click",()=>{i.classList.toggle("active")}),window.AOS&&AOS.init({duration:800,once:!0,mirror:!1}),handleTimelineAnimation();new class{constructor(){this.currentTheme=this.getStoredTheme()||this.getSystemTheme(),this.init()}getStoredTheme(){return localStorage.getItem("theme")}getSystemTheme(){return window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}setTheme(e){this.currentTheme=e,document.documentElement.setAttribute("data-theme",e),localStorage.setItem("theme",e),this.updateThemeIcon()}toggleTheme(){const e="light"===this.currentTheme?"dark":"light";this.setTheme(e)}updateThemeIcon(){const e=document.getElementById("theme-toggle");e&&e.setAttribute("aria-label","light"===this.currentTheme?"Switch to dark mode":"Switch to light mode")}init(){this.setTheme(this.currentTheme);const e=document.getElementById("theme-toggle");e&&e.addEventListener("click",()=>this.toggleTheme()),window.matchMedia("(prefers-color-scheme: light)").addEventListener("change",e=>{this.getStoredTheme()||this.setTheme(e.matches?"light":"dark")})}}}),window.addEventListener("scroll",function(){const e=document.querySelector(".progress-wrap"),t=document.querySelector(".progress-wrap path");if(e&&t){const n=t.getTotalLength(),o=window.pageYOffset,s=n*(o/(document.body.scrollHeight-window.innerHeight));t.style.strokeDasharray=n,t.style.strokeDashoffset=n-s,o>100?e.classList.add("active-progress"):e.classList.remove("active-progress")}}),document.addEventListener("click",function(e){e.target.closest(".progress-wrap")&&(e.preventDefault(),window.scrollTo({top:0,behavior:"smooth"}))}),document.querySelectorAll(".project-card-enhanced").forEach(e=>{e.addEventListener("mouseenter",function(){this.style.transform="translateY(-12px) scale(1.02)"}),e.addEventListener("mouseleave",function(){this.style.transform="translateY(0) scale(1)"}),e.addEventListener("click",function(e){const t=document.createElement("div"),n=this.getBoundingClientRect(),o=Math.max(n.width,n.height),s=e.clientX-n.left-o/2,r=e.clientY-n.top-o/2;t.style.width=t.style.height=o+"px",t.style.left=s+"px",t.style.top=r+"px",t.classList.add("ripple"),this.appendChild(t),setTimeout(()=>{t.remove()},600)})}),document.querySelectorAll('a[href^="#"]').forEach(e=>{e.addEventListener("click",function(e){e.preventDefault();const t=document.querySelector(this.getAttribute("href"));t&&t.scrollIntoView({behavior:"smooth",block:"start"})})}),window.addEventListener("scroll",updateTimelineFill);const observerOptions={threshold:.1,rootMargin:"0px 0px -50px 0px"},observer=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting&&(e.target.style.opacity="1",e.target.style.transform="translateY(0)")})},observerOptions);document.querySelectorAll(".project-card-enhanced, .timeline-entry-container").forEach(e=>{e.style.opacity="0",e.style.transform="translateY(30px)",e.style.transition="opacity 0.6s ease, transform 0.6s ease",observer.observe(e)});const style=document.createElement("style");// Highlight Active Link
function highlightActiveLink() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || (currentPath === 'index.html' && (href === './' || href === '/'))) {
            link.style.color = 'var(--primary-color)';
            link.style.fontWeight = '700';
        } else {
            link.style.color = '';
            link.style.fontWeight = '';
        }
    });
}

// Keyboard Help Modal
function toggleKeyboardHelp() {
    let modal = document.getElementById('keyboard-help-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'keyboard-help-modal';
        modal.className = 'keyboard-modal';
        modal.innerHTML = `
            <div class="keyboard-modal-content">
                <div class="modal-header">
                    <h3>Keyboard Shortcuts</h3>
                    <span class="close-modal" onclick="toggleKeyboardHelp()" style="position:static;">&times;</span>
                </div>
                <ul class="keyboard-shortcut-list">
                    <li><span>Home</span> <span class="key-badge">h</span></li>
                    <li><span>Portfolio</span> <span class="key-badge">p</span></li>
                    <li><span>Sites</span> <span class="key-badge">s</span></li>
                    <li><span>Blog</span> <span class="key-badge">b</span></li>
                    <li><span>Recommendations</span> <span class="key-badge">r</span></li>
                </ul>
                <p style="font-size: 0.8rem; opacity: 0.7; text-align: center; margin-top: 1rem;">Press any key to navigate</p>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) toggleKeyboardHelp();
        });
    }
    
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}

// Run on load
document.addEventListener('DOMContentLoaded', highlightActiveLink);

// Keyboard Navigation
document.addEventListener('keydown', (e) => {
    const target = e.target;
    // Ignore if user is typing or editing content
    if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
    ) {
        return;
    }

    const key = e.key || '';

    // Close modal on Escape
    if (key === 'Escape') {
        const modal = document.getElementById('keyboard-help-modal');
        if (modal && modal.style.display === 'block') {
            toggleKeyboardHelp();
            return;
        }
    }

    if (key === '?' || (key === '/' && e.shiftKey)) {
        e.preventDefault();
        toggleKeyboardHelp();
        return;
    }

    switch(key.toLowerCase()) {
        case 'h':
            window.location.href = 'index.html';
            break;
        case 'p':
            window.location.href = 'portfolio.html';
            break;
        case 's':
            window.location.href = 'sites.html';
            break;
        case 'b':
            window.location.href = 'blog.html';
            break;
        case 'r':
            window.location.href = 'recommendations.html';
            break;
    }
});

function updateTime() {
    const now = new Date();
    const jordanTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Amman"}));
    const timeString = jordanTime.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        timeZone: "Asia/Amman"
    });
    const element = document.getElementById('header-time');
    if (element) {
        element.textContent = timeString + ' GMT+3';
    }
}

// Initialize time display
document.addEventListener('DOMContentLoaded', () => {
    updateTime();
    setInterval(updateTime, 1000);
});

// Console Easter Egg
console.log(
    "%c Hello, Fellow Dev! %c\n\nIf you're looking at this, you probably like code too.\nFeel free to check out the source on GitHub: https://github.com/qusaismael/qusaismael.github.io\n\nStay secure! 🔒",
    "background: #2D1611; color: #F5F5DC; font-size: 24px; padding: 10px; border-radius: 5px; font-family: 'Recoleta', serif;",
    "color: #3C1810; font-size: 14px; font-family: monospace;"
);

function loadMediumPosts() {
    const postsContainer = document.getElementById('medium-posts');
    const recentContainer = document.getElementById('recent-medium-posts');

    const cta = {
        title: 'Read my latest on Medium ->',
        description: 'Loading… tap to open directly if slow.',
        url: 'https://medium.com/@qusaismael'
    };

    const renderCTA = (target) => {
        if (!target) return;
        target.innerHTML = '';
        const postElement = document.createElement('div');
        postElement.className = 'blog-post';
        postElement.innerHTML = `
            <h3>${cta.title}</h3>
            <p class="post-date">Live feed loads after this section is visible</p>
            <p>${cta.description}</p>
        `;
        postElement.addEventListener('click', () => window.open(cta.url, '_blank', 'noopener'));
        target.appendChild(postElement);
    };

    const renderPosts = (items) => {
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        };

        if (postsContainer) {
            postsContainer.innerHTML = '';
            items.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'blog-post';
                postElement.innerHTML = `
                    <h3>${post.title}</h3>
                    <p class="post-date">${formatDate(post.pubDate)}</p>
                    <p>${post.description.replace(/<[^>]*>/g, '').substring(0, 150)}...</p>
                `;
                postElement.addEventListener('click', () => showPostModal(post));
                postsContainer.appendChild(postElement);
            });
        }

        if (recentContainer) {
            recentContainer.innerHTML = '';
            items.slice(0, 2).forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'blog-post';
                postElement.innerHTML = `
                    <h3>${post.title}</h3>
                    <p class="post-date">${formatDate(post.pubDate)}</p>
                    <p>${post.description.replace(/<[^>]*>/g, '').substring(0, 150)}...</p>
                `;
                postElement.addEventListener('click', () => showPostModal(post));
                recentContainer.appendChild(postElement);
            });
        }
    };

    // Show immediate non-blocking CTA placeholders
    renderCTA(postsContainer);
    renderCTA(recentContainer);

    const startFetch = () => {
        if (loadMediumPosts.started) return;
        loadMediumPosts.started = true;

        const mediumUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://medium.com/feed/@qusaismael')}&_=${new Date().getTime()}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        fetch(mediumUrl, { signal: controller.signal })
            .then(response => response.json())
            .then(data => {
                if (!data || !data.items) return;
                renderPosts(data.items);
            })
            .catch(error => {
                console.error('Error loading Medium posts:', error);
            })
            .finally(() => clearTimeout(timeoutId));
    };

    const target = recentContainer || postsContainer;
    if ('IntersectionObserver' in window && target) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    obs.disconnect();
                    startFetch();
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        observer.observe(target);
    } else {
        if (document.readyState === 'complete') {
            startFetch();
        } else {
            window.addEventListener('load', startFetch, { once: true });
        }
    }
}function showPostModal(e){const t=document.getElementById("post-modal");document.getElementById("modal-body").innerHTML=`\n        <h2>${e.title}</h2>\n        <p class="post-date">${new Date(e.pubDate).toLocaleDateString()}</p>\n        ${e.description}\n    `,t.style.display="block";document.querySelector(".close-modal").onclick=()=>t.style.display="none",window.onclick=e=>{e.target===t&&(t.style.display="none")}}style.textContent="\n    .ripple {\n        position: absolute;\n        border-radius: 50%;\n        background: rgba(222, 94, 145, 0.3);\n        transform: scale(0);\n        animation: rippleEffect 0.6s linear;\n        pointer-events: none;\n    }\n    \n    @keyframes rippleEffect {\n        to {\n            transform: scale(2);\n            opacity: 0;\n        }\n    }\n",document.head.appendChild(style),document.addEventListener("DOMContentLoaded",loadMediumPosts);


document.querySelectorAll('.project-card-enhanced').forEach(card => {
    const link = card.querySelector('.project-arrow');
    if (link) {
        card.addEventListener('click', () => {
            window.open(link.href, '_blank');
        });
    }
});