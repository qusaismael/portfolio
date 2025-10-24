function handleTimelineAnimation(){const e=document.querySelector(".experience-timeline"),t=document.querySelector(".timeline-fill");if(!e||!t)return;const n=()=>{const n=e.getBoundingClientRect(),o=window.innerHeight,s=n.top+window.scrollY-o/2,r=n.height,i=window.scrollY;let l=0;i>s&&(l=(i-s)/r*100),l=Math.min(100,Math.max(0,l)),t.style.height=`${l}%`};let o=!1;window.addEventListener("scroll",()=>{o||(window.requestAnimationFrame(()=>{n(),o=!1}),o=!0)}),n()}function updateTimelineFill(){const e=document.querySelector(".timeline-fill"),t=document.querySelector(".experience-timeline");if(e&&t){const n=t.getBoundingClientRect(),o=window.innerHeight;if(n.top<o&&n.bottom>0){const t=Math.max(0,Math.min(1,(o-n.top)/(o+n.height)));e.style.height=100*t+"%"}}}document.addEventListener("DOMContentLoaded",e=>{const t=document.getElementById("preloader");t&&setTimeout(()=>{t.style.opacity="0",setTimeout(()=>{t.style.display="none"},500)},1e3);const n=document.querySelector(".cursor-dot"),o=document.querySelector(".cursor-outline");if(n&&o){let e=0,t=0,s=0,r=0;document.addEventListener("mousemove",function(o){e=o.clientX,t=o.clientY,n.style.left=e+"px",n.style.top=t+"px"}),function n(){s+=.1*(e-s),r+=.1*(t-r),o.style.left=s+"px",o.style.top=r+"px",requestAnimationFrame(n)}();document.querySelectorAll("a, button, .project-card-enhanced").forEach(e=>{e.addEventListener("mouseenter",()=>{n.style.transform="translate(-50%, -50%) scale(1.5)",o.style.transform="translate(-50%, -50%) scale(1.5)"}),e.addEventListener("mouseleave",()=>{n.style.transform="translate(-50%, -50%) scale(1)",o.style.transform="translate(-50%, -50%) scale(1)"})})}const s=document.querySelector(".progress-wrap");if(s){const e=s.querySelector("path");if(e){const t=e.getTotalLength();e.style.transition="none",e.style.WebkitTransition="none",e.style.strokeDasharray=`${t} ${t}`,e.style.strokeDashoffset=t,e.getBoundingClientRect(),e.style.transition="stroke-dashoffset 10ms linear",e.style.WebkitTransition="stroke-dashoffset 10ms linear";const n=50,o=()=>{const o=window.pageYOffset,r=document.documentElement.scrollHeight-window.innerHeight,i=t-o*t/r;e.style.strokeDashoffset=i,window.pageYOffset>n?s.classList.add("active-progress"):s.classList.remove("active-progress")};o(),window.addEventListener("scroll",o)}s.addEventListener("click",e=>(e.preventDefault(),window.scrollTo({top:0,behavior:"smooth"}),!1))}const r=document.querySelector(".nav-toggle"),i=document.querySelector("nav ul");r&&i&&r.addEventListener("click",()=>{i.classList.toggle("active")}),AOS.init({duration:800,once:!0,mirror:!1}),handleTimelineAnimation();new class{constructor(){this.currentTheme=this.getStoredTheme()||this.getSystemTheme(),this.init()}getStoredTheme(){return localStorage.getItem("theme")}getSystemTheme(){return window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}setTheme(e){this.currentTheme=e,document.documentElement.setAttribute("data-theme",e),localStorage.setItem("theme",e),this.updateThemeIcon()}toggleTheme(){const e="light"===this.currentTheme?"dark":"light";this.setTheme(e)}updateThemeIcon(){const e=document.getElementById("theme-toggle");e&&e.setAttribute("aria-label","light"===this.currentTheme?"Switch to dark mode":"Switch to light mode")}init(){this.setTheme(this.currentTheme);const e=document.getElementById("theme-toggle");e&&e.addEventListener("click",()=>this.toggleTheme()),window.matchMedia("(prefers-color-scheme: light)").addEventListener("change",e=>{this.getStoredTheme()||this.setTheme(e.matches?"light":"dark")})}}}),window.addEventListener("scroll",function(){const e=document.querySelector(".progress-wrap"),t=document.querySelector(".progress-wrap path");if(e&&t){const n=t.getTotalLength(),o=window.pageYOffset,s=n*(o/(document.body.scrollHeight-window.innerHeight));t.style.strokeDasharray=n,t.style.strokeDashoffset=n-s,o>100?e.classList.add("active-progress"):e.classList.remove("active-progress")}}),document.addEventListener("click",function(e){e.target.closest(".progress-wrap")&&(e.preventDefault(),window.scrollTo({top:0,behavior:"smooth"}))}),document.querySelectorAll(".project-card-enhanced").forEach(e=>{e.addEventListener("mouseenter",function(){this.style.transform="translateY(-12px) scale(1.02)"}),e.addEventListener("mouseleave",function(){this.style.transform="translateY(0) scale(1)"}),e.addEventListener("click",function(e){const t=document.createElement("div"),n=this.getBoundingClientRect(),o=Math.max(n.width,n.height),s=e.clientX-n.left-o/2,r=e.clientY-n.top-o/2;t.style.width=t.style.height=o+"px",t.style.left=s+"px",t.style.top=r+"px",t.classList.add("ripple"),this.appendChild(t),setTimeout(()=>{t.remove()},600)})}),document.querySelectorAll('a[href^="#"]').forEach(e=>{e.addEventListener("click",function(e){e.preventDefault();const t=document.querySelector(this.getAttribute("href"));t&&t.scrollIntoView({behavior:"smooth",block:"start"})})}),window.addEventListener("scroll",updateTimelineFill);const observerOptions={threshold:.1,rootMargin:"0px 0px -50px 0px"},observer=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting&&(e.target.style.opacity="1",e.target.style.transform="translateY(0)")})},observerOptions);document.querySelectorAll(".project-card-enhanced, .timeline-entry-container").forEach(e=>{e.style.opacity="0",e.style.transform="translateY(30px)",e.style.transition="opacity 0.6s ease, transform 0.6s ease",observer.observe(e)});const style=document.createElement("style");function loadMediumPosts() {
    const mediumUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://medium.com/feed/@qusaismael')}&_=${new Date().getTime()}`;
        fetch(mediumUrl)
        .then(response => response.json())
        .then(data => {
            const postsContainer = document.getElementById('medium-posts');
            const recentContainer = document.getElementById('recent-medium-posts');
            
            const formatDate = (dateString) => {
                const date = new Date(dateString);
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year}`;
            };
            
            if (postsContainer) {
                postsContainer.innerHTML = '';
                data.items.forEach(post => {
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
                data.items.slice(0, 2).forEach(post => {
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
        })
        .catch(error => {
            console.error('Error loading Medium posts:', error);
            if (postsContainer) {
                postsContainer.innerHTML = '<p>Failed to load blog posts. Please try again later.</p>';
            }
            if (recentContainer) {
                recentContainer.innerHTML = '<p>Failed to load recent posts.</p>';
            }
        });
}function showPostModal(e){const t=document.getElementById("post-modal");document.getElementById("modal-body").innerHTML=`\n        <h2>${e.title}</h2>\n        <p class="post-date">${new Date(e.pubDate).toLocaleDateString()}</p>\n        ${e.description}\n    `,t.style.display="block";document.querySelector(".close-modal").onclick=()=>t.style.display="none",window.onclick=e=>{e.target===t&&(t.style.display="none")}}style.textContent="\n    .ripple {\n        position: absolute;\n        border-radius: 50%;\n        background: rgba(222, 94, 145, 0.3);\n        transform: scale(0);\n        animation: rippleEffect 0.6s linear;\n        pointer-events: none;\n    }\n    \n    @keyframes rippleEffect {\n        to {\n            transform: scale(2);\n            opacity: 0;\n        }\n    }\n",document.head.appendChild(style),document.addEventListener("DOMContentLoaded",loadMediumPosts);


document.querySelectorAll('.project-card-enhanced').forEach(card => {
    const link = card.querySelector('.project-arrow');
    if (link) {
        card.addEventListener('click', () => {
            window.open(link.href, '_blank');
        });
    }
});