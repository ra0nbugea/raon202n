/**
 * app.js
 * Vanilla JS SPA Logic
 */

// State Management
function getSavedRole() {
    try {
        const saved = localStorage.getItem('raon_auth');
        if (saved) {
            const data = JSON.parse(saved);
            const now = new Date().getTime();
            // 30 days in milliseconds: 30 * 24 * 60 * 60 * 1000 = 2592000000
            if (now - data.timestamp < 2592000000) {
                return data.role;
            } else {
                localStorage.removeItem('raon_auth');
            }
        }
    } catch (e) {
        console.error('Failed to parse auth from localStorage');
    }
    return 'GUEST';
}

const state = {
    // Roles: 'GUEST', 'MEMBER', 'PRESIDENT'
    role: getSavedRole(),
    currentPath: window.location.hash.slice(1) || '/'
};

// Mock Data
const data = {
    clubInfo: {
        intro: '아직 등록되지 않았습니다.',
        goal: '아직 등록되지 않았습니다.',
        activities: '아직 등록되지 않았습니다.'
    },
    banners: [
        { id: 1, title: '라온과 함께 그려나가는 세상', subtitle: 'IMAGINE THE NEW WORLD, IMAGINE THE FUTURE', link: '#/activities', image: 'https://images.unsplash.com/photo-154946X364-e4X10XX0a23?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80' },
        { id: 2, title: '2026 라온 창작 발표회', subtitle: '부원들의 멋진 작품을 만나보세요', link: '#/gallery', image: 'https://images.unsplash.com/photo-14553X15X29-1XfX32b2XX08?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80' },
        { id: 3, title: '즐거운 활동 기록', subtitle: '우리의 일상을 엿보세요', link: '#/activities', image: 'https://images.unsplash.com/photo-1518X31eX3f6X5-7X3b2bX8c9X2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80' }
    ],
    announcements: [
        { id: 1, title: '2026년 1학기 라온 신입부원 모집', author: '부장', date: '2026-03-01' },
        { id: 2, title: '이번 주 동아리 활동 안내', author: '부장', date: '2026-03-10' }
    ],
    activities: [
        { id: 1, title: '캐릭터 시트 제작 기초', author: '김라온', date: '2026-03-05', imageId: 'activity_1' }
    ],
    gallery: [
        { id: 1, title: '봄날의 스케치', author: '일러스트레이터1', date: '2026-03-11', imageId: 'gallery_1' }
    ]
};

// Router paths
const routes = {
    '/': renderHome,
    '/announcements': renderAnnouncements,
    '/activities': renderActivities,
    '/gallery': renderGallery
};

// Initialize App
function init() {
    window.addEventListener('hashchange', () => {
        state.currentPath = window.location.hash.slice(1) || '/';
        renderApp();
    });
    renderApp();
}

// Main Render Function
function renderApp() {
    renderHeader(); // Always update header
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '';

    const renderFn = routes[state.currentPath] || render404;
    renderFn(mainContent);
}

// Render Header
function renderHeader() {
    const header = document.getElementById('header');

    // Role Badge Logic
    let roleText = '비로그인';
    if (state.role === 'MEMBER') roleText = '동아리원';
    if (state.role === 'PRESIDENT') roleText = '부장';

    let authButton = state.role === 'GUEST'
        ? `<button onclick="showLoginModal()"><i class="fas fa-sign-in-alt"></i> 로그인</button>`
        : `<button onclick="logout()"><i class="fas fa-sign-out-alt"></i> 로그아웃</button>`;

    header.innerHTML = `
        <div class="header-container">
            <div class="logo-area" style="cursor:pointer;" onclick="navigate('/')">
                <h1>라온(Raon)</h1>
                <p>만화·애니 창작 동아리</p>
            </div>
            <nav class="nav-links">
                <a href="#/" class="${state.currentPath === '/' ? 'active' : ''}">홈</a>
                <a href="#/announcements" class="${state.currentPath === '/announcements' ? 'active' : ''}">공지사항</a>
                <a href="#/activities" class="${state.currentPath === '/activities' ? 'active' : ''}">활동 공유</a>
                <a href="#/gallery" class="${state.currentPath === '/gallery' ? 'active' : ''}">개인작 업로드</a>
            </nav>
            <div class="auth-area">
                <span style="font-size: 0.8rem; margin-right: 10px; color: var(--text-muted);">현재 권한: ${roleText}</span>
                ${authButton}
            </div>
        </div>
    `;
}

// Navigate helper
function navigate(path) {
    window.location.hash = path;
}

// Modals and Auth
function showLoginModal() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>로그인</h3>
                    <button class="close-btn" onclick="closeModal(true)">&times;</button>
                </div>
                <div class="form-group">
                    <label>아이디</label>
                    <input type="text" id="loginId" placeholder="아이디 입력" onkeydown="if(event.key==='Enter') handleLogin()">
                </div>
                <div class="form-group">
                    <label>비밀번호</label>
                    <input type="password" id="loginPw" placeholder="비밀번호 입력" onkeydown="if(event.key==='Enter') handleLogin()">
                </div>
                <div class="form-group" style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1.5rem;">
                    <input type="checkbox" id="keepLoggedIn" style="width:auto; margin:0;" checked>
                    <label for="keepLoggedIn" style="margin:0; font-size:0.9rem; font-weight:normal; cursor:pointer;">로그인 상태 유지 (30일)</label>
                </div>
                <button class="btn-primary" style="width:100%" onclick="handleLogin()">로그인</button>
            </div>
        </div>
    `;
}

function handleLogin() {
    const id = document.getElementById('loginId').value;
    const pw = document.getElementById('loginPw').value;
    const keep = document.getElementById('keepLoggedIn').checked;

    let newRole = 'GUEST';

    if (id === 'RAON1234' && pw === 'BUGEA1234') {
        newRole = 'MEMBER';
    } else if (id === 'RAON5678' && pw === 'BUGEA5678') {
        newRole = 'PRESIDENT';
    } else {
        alert('아이디 또는 비밀번호가 잘못되었습니다.');
        return;
    }

    state.role = newRole;

    if (keep) {
        localStorage.setItem('raon_auth', JSON.stringify({
            role: newRole,
            timestamp: new Date().getTime()
        }));
    } else {
        localStorage.removeItem('raon_auth');
    }

    closeModal(true);
    renderApp();
}

function logout() {
    state.role = 'GUEST';
    localStorage.removeItem('raon_auth');
    renderApp();
}

function closeModal(isDirect = false, event = null) {
    if (isDirect || event.target.className === 'modal-overlay') {
        document.getElementById('modal-container').innerHTML = '';
    }
}

// President Club Info Edit Logic
function editClubInfo(type, title) {
    const currentVal = data.clubInfo[type];
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content" style="max-width: 600px;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>${title} 수정</h3>
                    <button class="close-btn" onclick="closeModal(true)">&times;</button>
                </div>
                <div class="form-group">
                    <textarea id="editInfoVal" style="height: 150px;">${currentVal}</textarea>
                </div>
                <button class="btn-primary" style="width:100%" onclick="saveClubInfo('${type}')">저장하기</button>
            </div>
        </div>
    `;
}

function saveClubInfo(type) {
    const val = document.getElementById('editInfoVal').value;
    data.clubInfo[type] = val;
    closeModal(true);
    renderApp();
}

// Banner Edit Logic
function editBanner(index) {
    const banner = data.banners[index];
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content" style="max-width: 500px;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>배너 수정 (${index + 1})</h3>
                    <button class="close-btn" onclick="closeModal(true)">&times;</button>
                </div>
                <div class="form-group">
                    <label>메인 문구</label>
                    <input type="text" id="editBannerTitle" value="${banner.title}">
                </div>
                <div class="form-group">
                    <label>서브 문구</label>
                    <input type="text" id="editBannerSubtitle" value="${banner.subtitle}">
                </div>
                <div class="form-group">
                    <label>클릭 시 이동할 링크</label>
                    <input type="text" id="editBannerLink" value="${banner.link}" placeholder="#/activities">
                </div>
                <div class="form-group">
                    <label>이미지 주소 (URL)</label>
                    <input type="text" id="editBannerImage" value="${banner.image}">
                </div>
                <button class="btn-primary" style="width:100%" onclick="saveBanner(${index})">저장하기</button>
            </div>
        </div>
    `;
}

function saveBanner(index) {
    data.banners[index].title = document.getElementById('editBannerTitle').value;
    data.banners[index].subtitle = document.getElementById('editBannerSubtitle').value;
    data.banners[index].link = document.getElementById('editBannerLink').value;
    data.banners[index].image = document.getElementById('editBannerImage').value;
    closeModal(true);
    renderApp();
}

// Admin Helper
function getAdminControls() {
    if (state.role !== 'PRESIDENT') return '';
    return `
        <div style="margin-top: 10px; display:flex; gap:0.5rem; justify-content:flex-end;">
            <button style="background:none; border:none; color:var(--text-muted); cursor:pointer;" onclick="alert('게시물 수정 권한 (기능은 준비 중입니다)')"><i class="fas fa-edit"></i> 수정</button>
            <button style="background:none; border:none; color:red; cursor:pointer;" onclick="alert('게시물 삭제 권한 (기능은 준비 중입니다)')"><i class="fas fa-trash"></i> 삭제</button>
        </div>
    `;
}

function getTableAdminControls() {
    if (state.role !== 'PRESIDENT') return '';
    return `
        <td>
            <button style="background:none; border:none; color:var(--text-muted); cursor:pointer;" onclick="alert('게시물 수정 권한')"><i class="fas fa-edit"></i></button>
            <button style="background:none; border:none; color:red; cursor:pointer;" onclick="alert('게시물 삭제 권한')"><i class="fas fa-trash"></i></button>
        </td>
    `;
}


// Page Renderers
let carouselInterval = null;

function renderHome(container) {
    let editBtnHtml = (type, title) => state.role === 'PRESIDENT' ? `<button class="btn-primary" style="padding:0.3rem 0.8rem; font-size:0.85rem;" onclick="event.stopPropagation(); editClubInfo('${type}', '${title}')"><i class="fas fa-edit"></i> 내용 수정</button>` : '';

    const heroSection = `
        <div style="text-align:left; padding: 4rem 2rem; max-width: 1200px; margin: 0 auto;">
            <h2 class="page-title" style="font-size: 3rem; color: var(--primary-color); margin-bottom: 0.5rem;">- 만화·애니 동아리, 라온</h2>
            <p style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 1rem; letter-spacing: 2px;">IMAGINE THE NEW WORLD, IMAGINE THE FUTURE</p>
        </div>
    `;

    const bannerSection = `
        <div class="carousel-container" id="homeCarousel">
            ${state.role === 'PRESIDENT' ? `<button class="edit-banner-btn" onclick="editBanner(parseInt(document.getElementById('homeCarousel').dataset.activeIndex || 0))"><i class="fas fa-edit"></i> 배너 수정</button>` : ''}
            
            <button class="carousel-control prev" onclick="event.stopPropagation(); changeSlide(-1)"><i class="fas fa-chevron-left"></i></button>
            <button class="carousel-control next" onclick="event.stopPropagation(); changeSlide(1)"><i class="fas fa-chevron-right"></i></button>

            ${data.banners.map((b, i) => `
                <div class="carousel-slide ${i === 0 ? 'active' : ''}" style="background-image: url('${b.image}'); background-color: #6CA6CD;" onclick="if(event.target.tagName !== 'BUTTON') navigate('${b.link}')">
                    <div class="carousel-overlay"></div>
                    <div class="carousel-content">
                        <h2>${b.title}</h2>
                        <p>${b.subtitle}</p>
                    </div>
                </div>
            `).join('')}

            <div class="carousel-indicators">
                ${data.banners.map((_, i) => `
                    <div class="carousel-indicator ${i === 0 ? 'active' : ''}" onclick="event.stopPropagation(); goToSlide(${i})"></div>
                `).join('')}
            </div>
        </div>
    `;

    container.innerHTML = `
        ${bannerSection}
        ${heroSection}
        
        <section style="margin-top:2rem; display:grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
            <div class="left-col" style="display:flex; flex-direction:column;">
                <!-- 동아리 소개 Accordion -->
                <div class="accordion-item" id="accordion-intro">
                    <div class="accordion-header" onclick="toggleAccordion('accordion-intro')">
                        <h3>동아리 소개</h3>
                        <div style="display:flex; align-items:center; gap: 1rem;">
                            ${editBtnHtml('intro', '동아리 소개')}
                            <i class="fas fa-chevron-down chevron"></i>
                        </div>
                    </div>
                    <div class="accordion-content">
                        <p style="color:var(--text-main); white-space:pre-wrap; line-height: 1.8;">${data.clubInfo.intro}</p>
                    </div>
                </div>

                <!-- 동아리 목표 Accordion -->
                <div class="accordion-item" id="accordion-goal">
                    <div class="accordion-header" onclick="toggleAccordion('accordion-goal')">
                        <h3>동아리 목표</h3>
                        <div style="display:flex; align-items:center; gap: 1rem;">
                            ${editBtnHtml('goal', '동아리 목표')}
                            <i class="fas fa-chevron-down chevron"></i>
                        </div>
                    </div>
                    <div class="accordion-content">
                        <p style="color:var(--text-main); white-space:pre-wrap; line-height: 1.8;">${data.clubInfo.goal}</p>
                    </div>
                </div>

                <!-- 활동 내용 Accordion -->
                <div class="accordion-item" id="accordion-activities">
                    <div class="accordion-header" onclick="toggleAccordion('accordion-activities')">
                        <h3>활동 내용</h3>
                        <div style="display:flex; align-items:center; gap: 1rem;">
                            ${editBtnHtml('activities', '활동 내용')}
                            <i class="fas fa-chevron-down chevron"></i>
                        </div>
                    </div>
                    <div class="accordion-content">
                        <p style="color:var(--text-main); white-space:pre-wrap; line-height: 1.8;">${data.clubInfo.activities}</p>
                    </div>
                </div>
            </div>
            
            <div class="right-col">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                    <h3 style="font-size: 1.3rem;">최근 공지사항</h3>
                    <a href="#/announcements" style="color:var(--primary-dark); font-size:0.9rem;">더보기 &gt;</a>
                </div>
                <ul style="border-top: 2px solid var(--text-main);">
                    ${data.announcements.slice(0, 5).map(ann => `
                        <li style="padding: 1rem 0; border-bottom: 1px solid var(--border-color); display:flex; flex-direction:column;">
                            <span style="font-weight:500; cursor:pointer;" onclick="navigate('/announcements')">${ann.title}</span>
                            <span style="color:var(--text-muted); font-size:0.85rem; margin-top:0.3rem;">${ann.date}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </section>

        <section style="margin-top: 2rem; margin-bottom: 4rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                <h3 style="font-size: 1.5rem;">최근 활동 공유</h3>
                <a href="#/activities" style="color:var(--primary-dark); font-size:0.9rem;">더보기 &gt;</a>
            </div>
            <div class="grid-container">
                ${data.activities.map(act => `
                    <div class="card" style="cursor:pointer;" onclick="navigate('/activities')">
                        <div class="card-img" style="background:#e0e0e0; display:flex; align-items:center; justify-content:center; color:#999;"><i class="fas fa-image fa-3x"></i></div>
                        <div class="card-body">
                            <div class="card-title">${act.title}</div>
                            <div class="card-meta"><span>${act.author}</span><span>${act.date}</span></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>
    `;
}

function renderAnnouncements(container) {
    if (state.role === 'GUEST') {
        renderUnauthorized(container, '동아리 회원 이상만 열람할 수 있습니다.');
        return;
    }

    let writeBtn = '';
    let thAdmin = '';
    if (state.role === 'PRESIDENT') {
        writeBtn = `<button class="btn-primary" onclick="alert('글쓰기 모달이 열립니다.')"><i class="fas fa-pen"></i> 공지 작성</button>`;
        thAdmin = `<th style="width:10%">관리</th>`;
    }

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 2rem;">
            <div>
                <h2 class="page-title">공지사항</h2>
                <p class="page-description" style="margin-bottom:0;">부원들을 위한 중요 공지사항 게시판입니다.</p>
            </div>
            ${writeBtn}
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th style="width:10%">번호</th>
                        <th style="width:${state.role === 'PRESIDENT' ? '50%' : '60%'}">제목</th>
                        <th style="width:15%">작성자</th>
                        <th style="width:15%">작성일</th>
                        ${thAdmin}
                    </tr>
                </thead>
                <tbody>
                    ${data.announcements.map(ann => `
                        <tr>
                            <td>${ann.id}</td>
                            <td style="font-weight:500;">${ann.title}</td>
                            <td>${ann.author}</td>
                            <td style="color:var(--text-muted); font-size:0.9rem;">${ann.date}</td>
                            ${getTableAdminControls()}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderActivities(container) {
    let writeBtn = '';
    if (state.role === 'MEMBER' || state.role === 'PRESIDENT') {
        writeBtn = `<button class="btn-primary" onclick="alert('글쓰기 모달이 열립니다.')"><i class="fas fa-pen"></i> 활동 기록하기</button>`;
    }

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 2rem;">
            <div>
                <h2 class="page-title">활동 공유</h2>
                <p class="page-description" style="margin-bottom:0;">라온 동아리의 다채로운 창작 여정을 공유합니다.</p>
            </div>
            ${writeBtn}
        </div>

        <div class="grid-container">
            ${data.activities.map(act => `
                <div class="card">
                    <div class="card-img" style="background:#e0eeef; display:flex; align-items:center; justify-content:center; color:var(--primary-dark);"><i class="fas fa-palette fa-3x"></i></div>
                    <div class="card-body">
                        <div class="card-title">${act.title}</div>
                        <div class="card-meta"><span><i class="fas fa-user"></i> ${act.author}</span><span>${act.date}</span></div>
                        ${getAdminControls()}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderGallery(container) {
    if (state.role === 'GUEST') {
        renderUnauthorized(container, '동아리의 회원만 개인작을 보고 업로드할 수 있습니다.');
        return;
    }

    let writeBtn = `<button class="btn-primary" onclick="alert('이미지 업로드 모달이 열립니다.')"><i class="fas fa-upload"></i> 작품 업로드</button>`;

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 2rem;">
            <div>
                <h2 class="page-title">개인작 업로드</h2>
                <p class="page-description" style="margin-bottom:0;">부원들의 멋진 개인 일러스트와 만화를 감상하세요.</p>
            </div>
            ${writeBtn}
        </div>

        <div class="grid-container">
            ${data.gallery.map(item => `
                <div class="card">
                    <div class="card-img" style="background:#f0e6ff; display:flex; align-items:center; justify-content:center; color:#9b59b6;"><i class="fas fa-paint-brush fa-3x"></i></div>
                    <div class="card-body">
                        <div class="card-title">${item.title}</div>
                        <div class="card-meta" style="margin-bottom:10px;"><span><i class="fas fa-user"></i> ${item.author}</span><span>${item.date}</span></div>
                        <button onclick="alert('이미지가 다운로드 됩니다.')" style="width:100%; padding:0.4rem; background:var(--bg-gray); border:1px solid var(--border-color); border-radius:4px; cursor:pointer; margin-bottom: 5px;"><i class="fas fa-download"></i> 다운로드</button>
                        ${getAdminControls()}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function render404(container) {
    container.innerHTML = `
        <div style="text-align:center; padding: 5rem 0;">
            <h2 class="page-title">404</h2>
            <p>페이지를 찾을 수 없습니다.</p>
            <button class="btn-primary" style="margin-top:2rem;" onclick="navigate('/')">홈으로 돌아가기</button>
        </div>
    `;
}

function renderUnauthorized(container, message) {
    container.innerHTML = `
        <div style="text-align:center; padding: 5rem 0;">
            <div style="font-size:4rem; color:var(--text-muted); margin-bottom:1rem;"><i class="fas fa-lock"></i></div>
            <h2 class="page-title" style="font-size:1.5rem;">접근 권한이 없습니다</h2>
            <p class="page-description">${message}</p>
            <p style="font-size:0.9rem; color:var(--primary-dark);">상단의 [로그인] 버튼을 눌러 접속해주세요.</p>
        </div>
    `;
}

// Carousel Logic
function startCarousel() {
    if (carouselInterval) clearInterval(carouselInterval);
    carouselInterval = setInterval(() => {
        const carousel = document.getElementById('homeCarousel');
        if (!carousel) {
            clearInterval(carouselInterval);
            return;
        }
        let currentIndex = parseInt(carousel.dataset.activeIndex || 0);
        let nextIndex = (currentIndex + 1) % data.banners.length;
        goToSlide(nextIndex);
    }, 5000);
}

function goToSlide(index) {
    const carousel = document.getElementById('homeCarousel');
    if (!carousel) return;

    carousel.dataset.activeIndex = index;
    const slides = carousel.querySelectorAll('.carousel-slide');
    const indicators = carousel.querySelectorAll('.carousel-indicator');

    slides.forEach((s, i) => {
        if (i === index) s.classList.add('active');
        else s.classList.remove('active');
    });

    indicators.forEach((ind, i) => {
        if (i === index) ind.classList.add('active');
        else ind.classList.remove('active');
    });

    // Reset timer when manually clicked
    startCarousel();
}

function changeSlide(dir) {
    const carousel = document.getElementById('homeCarousel');
    if (!carousel) return;
    let currentIndex = parseInt(carousel.dataset.activeIndex || 0);
    let nextIndex = (currentIndex + dir + data.banners.length) % data.banners.length;
    goToSlide(nextIndex);
}

// Accordion Logic
function toggleAccordion(id) {
    const item = document.getElementById(id);
    if (item) {
        item.classList.toggle('collapsed');
    }
}

// Intercept routing to handle carousel cleanup/setup
const originalRenderHome = renderHome;
routes['/'] = (container) => {
    originalRenderHome(container);
    startCarousel();
};

const originalInit = init;
document.addEventListener('DOMContentLoaded', () => {
    // Override the default hashchange so we can clear timers
    window.addEventListener('hashchange', () => {
        if (carouselInterval) clearInterval(carouselInterval);
    });
});

// Start
document.addEventListener('DOMContentLoaded', init);
