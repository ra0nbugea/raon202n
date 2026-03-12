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
    currentPath: window.location.hash.slice(1) || '/',
    filters: { semester: 'all', activity: 'all' }
};

// Mock Data & Local Storage Initialization
function loadData() {
    const defaultData = {
        clubInfo: {
            intro: '아직 등록되지 않았습니다.',
            goal: '아직 등록되지 않았습니다.',
            activities: '아직 등록되지 않았습니다.'
        },
        banners: [
            { id: 1, title: '라온과 함께 그려나가는 세상', subtitle: 'IMAGINE THE NEW WORLD, IMAGINE THE FUTURE', link: '#/activities', image: 'https://images.unsplash.com/photo-154946364-e41000a23?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80' },
            { id: 2, title: '2026 라온 창작 발표회', subtitle: '부원들의 멋진 작품을 만나보세요', link: '#/gallery', image: 'https://images.unsplash.com/photo-14553529-1f32b208?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80' },
            { id: 3, title: '즐거운 활동 기록', subtitle: '우리의 일상을 엿보세요', link: '#/activities', image: 'https://images.unsplash.com/photo-151831e3f65-73b2b8c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80' }
        ],
        categories: {
            semesters: ['2026-1학기', '2026-2학기'],
            activities: ['정기활동', '특별활동', '자유주제']
        },
        announcements: [
            { id: 1, title: '2026년 1학기 라온 신입부원 모집', content: '많은 지원 바랍니다!', author: '부장', date: '2026-03-01', semester: '2026-1학기', activity: '정기활동' },
            { id: 2, title: '이번 주 동아리 활동 안내', content: '이번 주는 캐릭터 시트 기초입니다.', author: '부장', date: '2026-03-10', semester: '2026-1학기', activity: '정기활동' }
        ],
        activities: [
            { id: 1, title: '캐릭터 시트 제작 기초', content: '오늘 만든 제 캐릭터 시트입니다.', author: '김라온', date: '2026-03-05', semester: '2026-1학기', activity: '정기활동' }
        ],
        gallery: [
            { id: 1, title: '봄날의 스케치', content: '봄 느낌으로 그려봤어요.', author: '일러스트레이터1', date: '2026-03-11', semester: '2026-1학기', activity: '자유주제' }
        ]
    };

    try {
        const savedData = localStorage.getItem('raon_data');
        if (savedData) {
            let parsed = JSON.parse(savedData);
            if(!parsed.categories) parsed.categories = defaultData.categories;
            if(!parsed.announcements[0]?.semester) {
                // Migrate old posts if they don't have categories
                parsed.announcements.forEach(p => { p.semester = p.semester || '2026-1학기'; p.activity = p.activity || '정기활동'; });
                parsed.activities.forEach(p => { p.semester = p.semester || '2026-1학기'; p.activity = p.activity || '정기활동'; });
                parsed.gallery.forEach(p => { p.semester = p.semester || '2026-1학기'; p.activity = p.activity || '자유주제'; });
            }
            return parsed;
        }
    } catch (e) {
        console.error('Failed to parse data from localStorage');
    }
    
    // Save defaults if nothing exists
    localStorage.setItem('raon_data', JSON.stringify(defaultData));
    return defaultData;
}

const data = loadData();

function saveData() {
    localStorage.setItem('raon_data', JSON.stringify(data));
}

// Router paths
const routes = {
    '/': renderHome,
    '/announcements': renderAnnouncements,
    '/activities': renderActivities,
    '/gallery': renderGallery,
    '/post': renderPostDetail // View single post
};

// Initialize App
function init() {
    window.addEventListener('hashchange', () => {
        state.currentPath = window.location.hash.slice(1) || '/';
        state.filters = { semester: 'all', activity: 'all' }; // Reset filters
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

    let adminMenu = state.role === 'PRESIDENT' 
        ? `<button onclick="openManageCategoriesModal()" style="margin-right:10px; background:none; border:none; color:var(--text-muted); cursor:pointer;"><i class="fas fa-cog"></i> 카테고리 관리</button>` 
        : '';

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
                ${adminMenu}
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
            <div class="modal-content" style="max-width: 800px; width:95%; height:80vh; display:flex; flex-direction:column;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>${title} 수정</h3>
                    <button class="close-btn" onclick="closeModal(true)">&times;</button>
                </div>
                <div class="editor-toolbar" style="margin-bottom: 10px; display:flex; gap:10px; padding:10px; border-bottom:1px solid var(--border-color); background:var(--bg-gray); border-radius:4px;">
                    <button type="button" onclick="document.execCommand('bold', false, null)" style="padding:5px 10px; cursor:pointer; background:white; border:1px solid #ccc; border-radius:4px;" title="굵게"><i class="fas fa-bold"></i></button>
                    <input type="color" id="textColorPicker" onchange="document.execCommand('foreColor', false, this.value)" style="cursor:pointer; width:40px; height:30px; border:none; padding:0;" title="글자색">
                    <label style="padding:5px 10px; cursor:pointer; background:white; border:1px solid #ccc; border-radius:4px;" title="이미지 첨부">
                        <i class="fas fa-image"></i> 사진 추가
                        <input type="file" accept="image/*" style="display:none;" onchange="insertEditorImage(this)">
                    </label>
                </div>
                <div class="form-group" style="flex:1; display:flex; flex-direction:column; overflow-y:auto;">
                    <div id="editInfoVal" contenteditable="true" style="flex:1; min-height: 200px; border:1px solid var(--border-color); border-radius:4px; outline:none; padding:10px; font-size:1.05rem; line-height:1.8;">${currentVal}</div>
                </div>
                <div class="modal-footer" style="margin-top:20px; text-align:right;">
                    <button class="btn-primary" style="background:var(--bg-gray); color:var(--text-main); margin-right:10px;" onclick="closeModal(true)">취소</button>
                    <button class="btn-primary" onclick="saveClubInfo('${type}')">저장하기</button>
                </div>
            </div>
        </div>
    `;
}

function saveClubInfo(type) {
    const val = document.getElementById('editInfoVal').innerHTML;
    data.clubInfo[type] = val;
    saveData();
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
                    <label>새 이미지 업로드</label>
                    <input type="file" id="editBannerImageFile" accept="image/*">
                    <p style="font-size:0.8rem; color:var(--text-muted); margin-top:5px;">파일을 선택하지 않으면 기존 이미지가 유지됩니다.</p>
                </div>
                <button class="btn-primary" style="width:100%" onclick="saveBanner(${index})">저장하기</button>
            </div>
        </div>
    `;
}

function saveBanner(index) {
    const fileInput = document.getElementById('editBannerImageFile');
    
    const saveDataAndRender = (imgBase64) => {
        data.banners[index].title = document.getElementById('editBannerTitle').value;
        data.banners[index].subtitle = document.getElementById('editBannerSubtitle').value;
        data.banners[index].link = document.getElementById('editBannerLink').value;
        if (imgBase64) data.banners[index].image = imgBase64;
        
        saveData();
        closeModal(true);
        renderApp();
    };

    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => saveDataAndRender(e.target.result);
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        saveDataAndRender(null);
    }
}

// Admin Helper
function getAdminControls(type, id) {
    if (state.role !== 'PRESIDENT') return '';
    return `
        <div style="margin-top: 10px; display:flex; gap:0.5rem; justify-content:flex-end;">
            <button style="background:none; border:none; color:var(--text-muted); cursor:pointer;" onclick="event.stopPropagation(); openEditPostModal('${type}', ${id})"><i class="fas fa-edit"></i> 수정</button>
            <button style="background:none; border:none; color:red; cursor:pointer;" onclick="event.stopPropagation(); deletePost('${type}', ${id})"><i class="fas fa-trash"></i> 삭제</button>
        </div>
    `;
}

function getTableAdminControls(type, id) {
    if (state.role !== 'PRESIDENT') return '';
    return `
        <td style="text-align:center;">
            <button style="background:none; border:none; color:var(--text-muted); cursor:pointer; margin-right:5px;" onclick="event.stopPropagation(); openEditPostModal('${type}', ${id})"><i class="fas fa-edit"></i></button>
            <button style="background:none; border:none; color:red; cursor:pointer;" onclick="event.stopPropagation(); deletePost('${type}', ${id})"><i class="fas fa-trash"></i></button>
        </td>
    `;
}

// Category Management
function openManageCategoriesModal() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content" style="max-width: 500px;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>카테고리 관리 (학기 / 활동)</h3>
                    <button class="close-btn" onclick="closeModal(true)">&times;</button>
                </div>
                <div class="form-group">
                    <label>학기 (콤마로 구분)</label>
                    <input type="text" id="editSemesters" value="${data.categories.semesters.join(', ')}">
                </div>
                <div class="form-group">
                    <label>활동 종류 (콤마로 구분)</label>
                    <input type="text" id="editActivities" value="${data.categories.activities.join(', ')}">
                </div>
                <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:15px;">새로운 학기나 활동 종류를 콤마(,)로 구분하여 적어주세요.</p>
                <button class="btn-primary" style="width:100%" onclick="saveCategories()">저장하기</button>
            </div>
        </div>
    `;
}

function saveCategories() {
    const semStr = document.getElementById('editSemesters').value;
    const actStr = document.getElementById('editActivities').value;
    
    data.categories.semesters = semStr.split(',').map(s => s.trim()).filter(s => s);
    data.categories.activities = actStr.split(',').map(s => s.trim()).filter(s => s);
    
    saveData();
    closeModal(true);
    renderApp();
}

// Editor Utilities
window.insertEditorImage = function(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imgHtml = `<img src="${e.target.result}" style="max-width:100%; border-radius:8px; margin: 10px 0;"><br>`;
            document.getElementById('postContent').focus();
            document.execCommand('insertHTML', false, imgHtml);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Board Creation & Editing Logic
function openWritePostModal(type) {
    let titlePlaceholder = '제목을 입력하세요';
    let contentPlaceholder = '내용을 입력하세요. (카페/밴드 스타일로 자유롭게 작성해보세요)';
    let title = '새 게시물 작성';
    
    const semesterOptions = data.categories.semesters.map(s => `<option value="${s}">${s}</option>`).join('');
    const activityOptions = data.categories.activities.map(a => `<option value="${a}">${a}</option>`).join('');

    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content" style="max-width: 800px; width:95%; height:90vh; display:flex; flex-direction:column;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="close-btn" onclick="closeModal(true)">&times;</button>
                </div>
                <div class="post-editor-body" style="flex:1; display:flex; flex-direction:column; overflow-y:auto; padding-right:10px;">
                    <div style="display:flex; gap:10px; margin-bottom:10px;">
                        <input type="text" id="postAuthor" value="${state.role === 'PRESIDENT' ? '부장' : (state.role === 'MEMBER' ? '동아리원' : '손님')}" placeholder="작성자" style="padding:8px; border:1px solid var(--border-color); border-radius:4px; font-family:inherit; width:120px;">
                        <select id="postSemester" style="padding:8px; border:1px solid var(--border-color); border-radius:4px; font-family:inherit;">
                            ${semesterOptions}
                        </select>
                        <select id="postActivity" style="padding:8px; border:1px solid var(--border-color); border-radius:4px; font-family:inherit;">
                            ${activityOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <input type="text" id="postTitle" placeholder="${titlePlaceholder}" style="font-size: 1.2rem; font-weight: bold; border:none; border-bottom: 2px solid var(--border-color); border-radius:0; padding:10px 0;">
                    </div>
                    
                    <div class="editor-toolbar" style="margin-bottom: 10px; display:flex; gap:10px; padding:10px; border-bottom:1px solid var(--border-color); background:var(--bg-gray); border-radius:4px;">
                        <button type="button" onclick="document.execCommand('bold', false, null)" style="padding:5px 10px; cursor:pointer; background:white; border:1px solid #ccc; border-radius:4px;" title="굵게"><i class="fas fa-bold"></i></button>
                        <input type="color" id="textColorPicker" onchange="document.execCommand('foreColor', false, this.value)" style="cursor:pointer; width:40px; height:30px; border:none; padding:0;" title="글자색">
                        <label style="padding:5px 10px; cursor:pointer; background:white; border:1px solid #ccc; border-radius:4px;" title="이미지 첨부">
                            <i class="fas fa-image"></i> 사진 추가
                            <input type="file" accept="image/*" style="display:none;" onchange="insertEditorImage(this)">
                        </label>
                    </div>
                    
                    <div class="form-group" style="flex:1; display:flex; flex-direction:column;">
                        <div id="postContent" contenteditable="true" data-placeholder="${contentPlaceholder}" style="flex:1; min-height: 300px; border:none; outline:none; padding:10px 0; font-size:1.05rem; overflow-y:auto; line-height:1.8;"></div>
                    </div>
                </div>
                <div class="modal-footer" style="margin-top:20px; text-align:right; border-top:1px solid var(--border-color); padding-top:15px;">
                    <button class="btn-primary" style="background:var(--bg-gray); color:var(--text-main); margin-right:10px;" onclick="closeModal(true)">취소</button>
                    <button class="btn-primary" onclick="submitPost('${type}')">등록하기</button>
                </div>
            </div>
        </div>
    `;
    
    // Add placeholder behavior
    const editor = document.getElementById('postContent');
    editor.addEventListener('focus', function() { if(this.innerHTML === '') this.innerHTML = '<p><br></p>'; });
    editor.addEventListener('blur', function() { if(this.innerHTML === '<p><br></p>' || this.innerHTML.trim() === '') this.innerHTML = ''; });
}

function openEditPostModal(type, id) {
    const post = data[type].find(p => p.id === id);
    if (!post) return;

    const semesterOptions = data.categories.semesters.map(s => `<option value="${s}" ${post.semester === s ? 'selected' : ''}>${s}</option>`).join('');
    const activityOptions = data.categories.activities.map(a => `<option value="${a}" ${post.activity === a ? 'selected' : ''}>${a}</option>`).join('');

    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content" style="max-width: 800px; width:95%; height:90vh; display:flex; flex-direction:column;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>게시물 수정</h3>
                    <button class="close-btn" onclick="closeModal(true)">&times;</button>
                </div>
                <div class="post-editor-body" style="flex:1; display:flex; flex-direction:column; overflow-y:auto; padding-right:10px;">
                    <div style="display:flex; gap:10px; margin-bottom:10px;">
                        <input type="text" id="postAuthor" value="${post.author}" placeholder="작성자" style="padding:8px; border:1px solid var(--border-color); border-radius:4px; font-family:inherit; width:120px;">
                        <select id="postSemester" style="padding:8px; border:1px solid var(--border-color); border-radius:4px; font-family:inherit;">
                            ${semesterOptions}
                        </select>
                        <select id="postActivity" style="padding:8px; border:1px solid var(--border-color); border-radius:4px; font-family:inherit;">
                            ${activityOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <input type="text" id="postTitle" value="${post.title}" style="font-size: 1.2rem; font-weight: bold; border:none; border-bottom: 2px solid var(--border-color); border-radius:0; padding:10px 0;">
                    </div>
                    
                    <div class="editor-toolbar" style="margin-bottom: 10px; display:flex; gap:10px; padding:10px; border-bottom:1px solid var(--border-color); background:var(--bg-gray); border-radius:4px;">
                        <button type="button" onclick="document.execCommand('bold', false, null)" style="padding:5px 10px; cursor:pointer; background:white; border:1px solid #ccc; border-radius:4px;" title="굵게"><i class="fas fa-bold"></i></button>
                        <input type="color" id="textColorPicker" onchange="document.execCommand('foreColor', false, this.value)" style="cursor:pointer; width:40px; height:30px; border:none; padding:0;" title="글자색">
                        <label style="padding:5px 10px; cursor:pointer; background:white; border:1px solid #ccc; border-radius:4px;" title="이미지 첨부">
                            <i class="fas fa-image"></i> 사진 추가
                            <input type="file" accept="image/*" style="display:none;" onchange="insertEditorImage(this)">
                        </label>
                    </div>
                    
                    <div class="form-group" style="flex:1; display:flex; flex-direction:column;">
                        <div id="postContent" contenteditable="true" style="flex:1; min-height: 300px; border:none; outline:none; padding:10px 0; font-size:1.05rem; overflow-y:auto; line-height:1.8;">${post.content || ''}</div>
                    </div>
                </div>
                <div class="modal-footer" style="margin-top:20px; text-align:right; border-top:1px solid var(--border-color); padding-top:15px;">
                    <button class="btn-primary" style="background:var(--bg-gray); color:var(--text-main); margin-right:10px;" onclick="closeModal(true)">취소</button>
                    <button class="btn-primary" onclick="submitEditPost('${type}', ${id})">수정하기</button>
                </div>
            </div>
        </div>
    `;
}

function submitPost(type) {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').innerHTML;
    const semester = document.getElementById('postSemester').value;
    const activity = document.getElementById('postActivity').value;
    
    if (!title) {
        alert('제목을 입력해주세요.');
        return;
    }

    const today = new Date();
    const dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    
    const authorName = document.getElementById('postAuthor').value || '익명';

    // Extract first image from content as thumbnail (if available)
    let thumbnail = '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const firstImg = tempDiv.querySelector('img');
    if (firstImg) thumbnail = firstImg.src;

    const newPost = {
        id: data[type].length > 0 ? Math.max(...data[type].map(p => p.id)) + 1 : 1,
        title: title,
        content: content,
        author: authorName,
        date: dateStr,
        semester: semester,
        activity: activity,
        image: thumbnail
    };

    data[type].unshift(newPost); // Add to beginning
    saveData();
    closeModal(true);
    renderApp();
}

function submitEditPost(type, id) {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').innerHTML;
    const semester = document.getElementById('postSemester').value;
    const activity = document.getElementById('postActivity').value;
    const authorName = document.getElementById('postAuthor').value || '익명';
    
    if (!title) {
        alert('제목을 입력해주세요.');
        return;
    }

    const postIndex = data[type].findIndex(p => p.id === id);
    if (postIndex === -1) return;

    // Extract first image from content as thumbnail (if available)
    let thumbnail = '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const firstImg = tempDiv.querySelector('img');
    if (firstImg) thumbnail = firstImg.src;

    data[type][postIndex].title = title;
    data[type][postIndex].content = content;
    data[type][postIndex].semester = semester;
    data[type][postIndex].activity = activity;
    data[type][postIndex].image = thumbnail;
    data[type][postIndex].author = authorName;

    saveData();
    closeModal(true);
    renderApp();
}

function deletePost(type, id) {
    if (confirm('이 게시물을 정말 삭제하시겠습니까?')) {
        data[type] = data[type].filter(p => p.id !== id);
        saveData();
        renderApp();
    }
}

// Post Detail View
function navigateToPost(type, id) {
    window.location.hash = `/post?type=${type}&id=${id}`;
}

function renderPostDetail(container) {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const type = params.get('type');
    const id = parseInt(params.get('id'));

    if (!type || !id || !data[type]) {
        return render404(container);
    }

    const post = data[type].find(p => p.id === id);
    if (!post) {
        return render404(container);
    }

    let boardName = type === 'announcements' ? '공지사항' : type === 'activities' ? '활동 공유' : '개인작 업로드';

    container.innerHTML = `
        <div style="max-width: 900px; margin: 0 auto; background:white; padding: 3rem; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
            <div style="margin-bottom: 2rem;">
                <span style="color:var(--primary-dark); font-weight:bold; cursor:pointer;" onclick="navigate('/${type}')">&lt; ${boardName} 목록으로</span>
            </div>
            
            <div style="margin-bottom: 0.5rem; display:flex; gap:10px;">
                <span style="font-size:0.85rem; color:var(--primary-dark); background:#f0f7fb; padding:3px 10px; border-radius:12px;">${post.semester || '학기 미지정'}</span>
                <span style="font-size:0.85rem; color:var(--text-muted); background:var(--bg-gray); padding:3px 10px; border-radius:12px;">${post.activity || '활동 미지정'}</span>
            </div>
            <h1 style="font-size: 2rem; margin-bottom: 1rem; color:var(--text-main); line-height:1.4;">${post.title}</h1>
            
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 2rem; color:var(--text-muted);">
                <div style="display:flex; align-items:center; gap: 10px;">
                    <div style="width:40px; height:40px; background:var(--bg-gray); border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:1.2rem; background-color:var(--primary-dark);">
                        <i class="fas fa-user"></i>
                    </div>
                    <div>
                        <div style="font-weight:600; color:var(--text-main);">${post.author}</div>
                        <div style="font-size:0.85rem;">${post.date}</div>
                    </div>
                </div>
                ${state.role === 'PRESIDENT' ? `
                    <div>
                        <button style="background:none; border:none; color:var(--text-muted); cursor:pointer; margin-right:10px;" onclick="openEditPostModal('${type}', ${id})">수정</button>
                        <button style="background:none; border:none; color:red; cursor:pointer;" onclick="deletePost('${type}', ${id}); navigate('/${type}')">삭제</button>
                    </div>
                ` : ''}
            </div>

            <div class="post-content" style="font-size: 1.1rem; line-height: 1.8; color: var(--text-main); word-break: break-all; white-space: pre-wrap;">
                ${post.content || ''}
            </div>
            
            <div style="margin-top: 4rem; text-align:center;">
                <button class="btn-primary" style="background-color:white; color:var(--text-main); border:1px solid var(--border-color);" onclick="navigate('/${type}')">목록보기</button>
            </div>
        </div>
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

// Filter helper
window.applyFilter = function(filterType, value) {
    state.filters[filterType] = value;
    renderApp();
}

function getFilterBarHTML(type) {
    const semOptions = data.categories.semesters.map(s => `<option value="${s}" ${state.filters.semester === s ? 'selected' : ''}>${s}</option>`).join('');
    const actOptions = data.categories.activities.map(a => `<option value="${a}" ${state.filters.activity === a ? 'selected' : ''}>${a}</option>`).join('');
    
    return `
        <div style="display:flex; gap:10px; margin-right:15px;">
            <select onchange="applyFilter('semester', this.value)" style="padding:6px; border:1px solid var(--border-color); border-radius:4px; font-family:inherit;">
                <option value="all">학기 전체</option>
                ${semOptions}
            </select>
            <select onchange="applyFilter('activity', this.value)" style="padding:6px; border:1px solid var(--border-color); border-radius:4px; font-family:inherit;">
                <option value="all">활동 전체</option>
                ${actOptions}
            </select>
        </div>
    `;
}

function getFilteredData(type) {
    let list = data[type] || [];
    if (state.filters.semester !== 'all') list = list.filter(p => p.semester === state.filters.semester);
    if (state.filters.activity !== 'all') list = list.filter(p => p.activity === state.filters.activity);
    return list;
}

function renderAnnouncements(container) {
    if (state.role === 'GUEST') {
        renderUnauthorized(container, '동아리 회원 이상만 열람할 수 있습니다.');
        return;
    }

    let writeBtn = '';
    let thAdmin = '';
    if (state.role === 'PRESIDENT') {
        writeBtn = `<button class="btn-primary" onclick="openWritePostModal('announcements')"><i class="fas fa-pen"></i> 공지 작성</button>`;
        thAdmin = `<th style="width:10%; text-align:center;">관리</th>`;
    }

    const filtered = getFilteredData('announcements');

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 2rem;">
            <div>
                <h2 class="page-title">공지사항</h2>
                <p class="page-description" style="margin-bottom:0;">부원들을 위한 중요 공지사항 게시판입니다.</p>
            </div>
            <div style="display:flex; align-items:center;">
                ${getFilterBarHTML('announcements')}
                ${writeBtn}
            </div>
        </div>

        <div class="table-container" style="background:white; border-radius:8px; border:1px solid var(--border-color); overflow:hidden;">
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
                    ${filtered.length === 0 ? `<tr><td colspan="5" style="text-align:center; padding:2rem;">조건에 맞는 공지사항이 없습니다.</td></tr>` : 
                    filtered.map(ann => `
                        <tr style="cursor:pointer;" onclick="navigateToPost('announcements', ${ann.id})">
                            <td>${ann.id}</td>
                            <td style="font-weight:500;">
                                <span style="font-size:0.8rem; color:var(--text-muted); margin-right:5px;">[${ann.semester || ''} ${ann.activity || ''}]</span>
                                ${ann.title}
                            </td>
                            <td>${ann.author}</td>
                            <td style="color:var(--text-muted); font-size:0.9rem;">${ann.date}</td>
                            ${getTableAdminControls('announcements', ann.id)}
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
        writeBtn = `<button class="btn-primary" onclick="openWritePostModal('activities')"><i class="fas fa-pen"></i> 활동 기록하기</button>`;
    }

    const filtered = getFilteredData('activities');

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 2rem;">
            <div>
                <h2 class="page-title">활동 공유</h2>
                <p class="page-description" style="margin-bottom:0;">라온 동아리의 다채로운 창작 여정을 공유합니다.</p>
            </div>
            <div style="display:flex; align-items:center;">
                ${getFilterBarHTML('activities')}
                ${writeBtn}
            </div>
        </div>

        <div class="grid-container">
            ${filtered.length === 0 ? `<div style="grid-column: 1/-1; text-align:center; padding:3rem; color:var(--text-muted); background:white; border:1px solid var(--border-color); border-radius:8px;">조건에 맞는 게시물이 없습니다.</div>` : 
            filtered.map(act => `
                <div class="card" style="cursor:pointer;" onclick="navigateToPost('activities', ${act.id})">
                    <div class="card-img" style="background-image:url('${act.image || ''}'); background-size:cover; background-position:center; background-color:#e0eeef; display:flex; align-items:center; justify-content:center; color:var(--primary-dark);">
                        ${!act.image ? '<i class="fas fa-palette fa-3x"></i>' : ''}
                    </div>
                    <div class="card-body">
                        <div style="font-size:0.75rem; color:var(--primary-dark); margin-bottom:5px;">${act.semester || ''} | ${act.activity || ''}</div>
                        <div class="card-title">${act.title}</div>
                        <div class="card-meta"><span><i class="fas fa-user"></i> ${act.author}</span><span>${act.date}</span></div>
                        ${getAdminControls('activities', act.id)}
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

    let writeBtn = `<button class="btn-primary" onclick="openWritePostModal('gallery')"><i class="fas fa-upload"></i> 작품 업로드</button>`;

    const filtered = getFilteredData('gallery');

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 2rem;">
            <div>
                <h2 class="page-title">개인작 업로드</h2>
                <p class="page-description" style="margin-bottom:0;">부원들의 멋진 개인 일러스트와 만화를 감상하세요.</p>
            </div>
            <div style="display:flex; align-items:center;">
                ${getFilterBarHTML('gallery')}
                ${writeBtn}
            </div>
        </div>

        <div class="grid-container">
            ${filtered.length === 0 ? `<div style="grid-column: 1/-1; text-align:center; padding:3rem; color:var(--text-muted); background:white; border:1px solid var(--border-color); border-radius:8px;">조건에 맞는 작품이 없습니다.</div>` :
            filtered.map(item => `
                <div class="card" style="cursor:pointer;" onclick="navigateToPost('gallery', ${item.id})">
                    <div class="card-img" style="background-image:url('${item.image || ''}'); background-size:cover; background-position:center; background-color:#f0e6ff; display:flex; align-items:center; justify-content:center; color:#9b59b6;">
                        ${!item.image ? '<i class="fas fa-paint-brush fa-3x"></i>' : ''}
                    </div>
                    <div class="card-body">
                        <div style="font-size:0.75rem; color:#9b59b6; margin-bottom:5px;">${item.semester || ''} | ${item.activity || ''}</div>
                        <div class="card-title">${item.title}</div>
                        <div class="card-meta" style="margin-bottom:10px;"><span><i class="fas fa-user"></i> ${item.author}</span><span>${item.date}</span></div>
                        ${item.image ? `<button onclick="event.stopPropagation(); window.open('${item.image}', '_blank')" style="width:100%; padding:0.4rem; background:var(--bg-gray); border:1px solid var(--border-color); border-radius:4px; cursor:pointer; margin-bottom: 5px; transition:0.2s;"><i class="fas fa-download"></i> 원본 보기</button>` : ''}
                        ${getAdminControls('gallery', item.id)}
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
