import { auth, api } from './lib/api.js';

let currentSection = 'hero';
let currentUser = null;

const sections = {
  hero: renderHeroSection,
  program: renderProgramSection,
  teachers: renderTeachersSection,
  reviews: renderReviewsSection,
  contacts: renderContactsSection,
  logos: renderLogosSection,
  documents: renderDocumentsSection
};

async function init() {
  try {
    currentUser = await auth.getUser();

    if (currentUser) {
      showAdminScreen();
    } else {
      showLoginScreen();
    }
  } catch (error) {
    showLoginScreen();
  }

  setupEventListeners();
}

function showLoginScreen() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-screen').style.display = 'none';
}

function showAdminScreen() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-screen').style.display = 'flex';
  renderCurrentSection();
}

function setupEventListeners() {
  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', handleLogin);

  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn.addEventListener('click', handleLogout);

  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const section = item.dataset.section;
      switchSection(section);
    });
  });
}

async function handleLogin(e) {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('login-error');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');

  errorEl.style.display = 'none';
  submitBtn.disabled = true;
  btnText.style.display = 'none';
  btnSpinner.style.display = 'inline-block';

  try {
    await auth.signIn(username, password);
    currentUser = await auth.getUser();
    showAdminScreen();
    showNotification('Успешный вход', 'success');
  } catch (error) {
    errorEl.textContent = error.message || 'Ошибка входа';
    errorEl.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    btnText.style.display = 'inline';
    btnSpinner.style.display = 'none';
  }
}

async function handleLogout() {
  try {
    await auth.signOut();
    currentUser = null;
    showLoginScreen();
    showNotification('Выход выполнен', 'success');
  } catch (error) {
    showNotification('Ошибка при выходе', 'error');
  }
}

function switchSection(section) {
  currentSection = section;

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  const activeItem = document.querySelector(`.nav-item[data-section="${section}"]`);
  if (activeItem) {
    activeItem.classList.add('active');
  }

  renderCurrentSection();
}

async function renderCurrentSection() {
  const contentArea = document.getElementById('content-area');
  contentArea.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

  try {
    const renderFunction = sections[currentSection];
    if (renderFunction) {
      await renderFunction();
    }
  } catch (error) {
    console.error('Error rendering section:', error);
    contentArea.innerHTML = '<div class="error-message">Ошибка загрузки данных</div>';
  }
}

async function renderHeroSection() {
  const content = await api.getSiteContent();
  const hero = content.hero || {};

  const html = `
    <div class="section-header">
      <h1 class="section-title">Hero секция</h1>
      <p class="section-description">Управление главной секцией сайта</p>
    </div>

    <div class="card">
      <h3 class="card-title">Основной контент</h3>
      <form id="hero-form">
        <div class="form-group">
          <label class="form-label">Заголовок</label>
          <input type="text" class="form-input" name="title" value="${hero.title || ''}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Подзаголовок</label>
          <textarea class="form-textarea" name="subtitle" required>${hero.subtitle || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">URL изображения Hero</label>
          <input type="url" class="form-input" name="hero_image_url" value="${hero.hero_image_url || ''}" placeholder="https://example.com/image.jpg" />
        </div>
        <div class="form-group">
          <label class="form-label">URL логотипа</label>
          <input type="text" class="form-input" name="logo_url" value="${hero.logo_url || ''}" placeholder="/Logo.png" />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-success">Сохранить изменения</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h3 class="card-title">Загрузка изображения Hero</h3>
      <div class="image-upload">
        <div class="upload-area" id="hero-upload-area">
          <svg class="upload-icon" viewBox="0 0 48 48" fill="none">
            <path d="M24 12v24M12 24h24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <p class="upload-text">Перетащите изображение или нажмите для выбора</p>
          <p class="upload-hint">JPG, PNG, WebP до 5MB</p>
        </div>
        <input type="file" id="hero-image-input" accept="image/*" style="display: none;" />
        <div id="hero-preview" class="image-preview"></div>
      </div>
    </div>
  `;

  document.getElementById('content-area').innerHTML = html;

  document.getElementById('hero-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      await api.updateSiteContent('hero', 'title', formData.get('title'));
      await api.updateSiteContent('hero', 'subtitle', formData.get('subtitle'));
      await api.updateSiteContent('hero', 'hero_image_url', formData.get('hero_image_url'));
      await api.updateSiteContent('hero', 'logo_url', formData.get('logo_url'));
      showNotification('Hero секция обновлена', 'success');
    } catch (error) {
      showNotification('Ошибка сохранения', 'error');
    }
  });

  setupImageUpload('hero-upload-area', 'hero-image-input', 'hero-preview', async (file) => {
    try {
      const { publicUrl } = await api.uploadImage(file, 'hero');
      await api.updateSiteContent('hero', 'hero_image_url', publicUrl);
      showNotification('Изображение загружено', 'success');
      renderCurrentSection();
    } catch (error) {
      showNotification('Ошибка загрузки изображения', 'error');
    }
  });
}

async function renderProgramSection() {
  const [content, cards] = await Promise.all([
    api.getSiteContent(),
    api.getProgramCards()
  ]);

  const program = content.program || {};

  const html = `
    <div class="section-header">
      <h1 class="section-title">Программа</h1>
      <p class="section-description">Управление карточками программы</p>
    </div>

    <div class="card">
      <h3 class="card-title">Заголовки секции</h3>
      <form id="program-header-form">
        <div class="form-group">
          <label class="form-label">Заголовок</label>
          <input type="text" class="form-input" name="title" value="${program.title || ''}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Подзаголовок</label>
          <input type="text" class="form-input" name="subtitle" value="${program.subtitle || ''}" required />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-success">Сохранить</button>
        </div>
      </form>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Карточки программы</h3>
        <button class="btn btn-primary btn-small" id="add-card-btn">+ Добавить карточку</button>
      </div>
      <div id="cards-list">
        ${cards.map(card => `
          <div class="list-item" data-id="${card.id}">
            <div class="list-item-content">
              <div class="list-item-title">${card.title}</div>
              <div class="list-item-description">${card.description}</div>
            </div>
            <div class="list-item-actions">
              <button class="btn btn-secondary btn-small edit-card-btn" data-id="${card.id}">Редактировать</button>
              <button class="btn btn-danger btn-small delete-card-btn" data-id="${card.id}">Удалить</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div id="card-modal" style="display: none;"></div>
  `;

  document.getElementById('content-area').innerHTML = html;

  document.getElementById('program-header-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      await api.updateSiteContent('program', 'title', formData.get('title'));
      await api.updateSiteContent('program', 'subtitle', formData.get('subtitle'));
      showNotification('Заголовки обновлены', 'success');
    } catch (error) {
      showNotification('Ошибка сохранения', 'error');
    }
  });

  document.getElementById('add-card-btn').addEventListener('click', () => showCardModal());

  document.querySelectorAll('.edit-card-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cardId = btn.dataset.id;
      const card = cards.find(c => c.id === cardId);
      showCardModal(card);
    });
  });

  document.querySelectorAll('.delete-card-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Удалить эту карточку?')) {
        try {
          await api.deleteProgramCard(btn.dataset.id);
          showNotification('Карточка удалена', 'success');
          renderCurrentSection();
        } catch (error) {
          showNotification('Ошибка удаления', 'error');
        }
      }
    });
  });
}

function showCardModal(card = null) {
  const isEdit = !!card;

  const modalHtml = `
    <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
      <div style="background: var(--color-bg-secondary); padding: var(--spacing-xl); border-radius: var(--radius-lg); max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;">
        <h3 class="card-title">${isEdit ? 'Редактировать' : 'Добавить'} карточку</h3>
        <form id="card-form">
          <div class="form-group">
            <label class="form-label">Название</label>
            <input type="text" class="form-input" name="title" value="${card?.title || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Описание</label>
            <textarea class="form-textarea" name="description" required>${card?.description || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">SVG иконка</label>
            <textarea class="form-textarea" name="icon_svg" placeholder="<svg>...</svg>">${card?.icon_svg || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Порядок отображения</label>
            <input type="number" class="form-input" name="order_index" value="${card?.order_index || 0}" required />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-success">${isEdit ? 'Сохранить' : 'Добавить'}</button>
            <button type="button" class="btn btn-secondary" id="close-modal">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const modal = document.getElementById('card-modal');
  modal.innerHTML = modalHtml;
  modal.style.display = 'block';

  document.getElementById('close-modal').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  document.getElementById('card-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const cardData = {
      title: formData.get('title'),
      description: formData.get('description'),
      icon_svg: formData.get('icon_svg'),
      order_index: parseInt(formData.get('order_index'))
    };

    try {
      if (isEdit) {
        await api.updateProgramCard(card.id, cardData);
        showNotification('Карточка обновлена', 'success');
      } else {
        await api.createProgramCard(cardData);
        showNotification('Карточка добавлена', 'success');
      }
      modal.style.display = 'none';
      renderCurrentSection();
    } catch (error) {
      showNotification('Ошибка сохранения', 'error');
    }
  });
}

async function renderTeachersSection() {
  const [content, teachers] = await Promise.all([
    api.getSiteContent(),
    api.getTeachers()
  ]);

  const teachersContent = content.teachers || {};

  const html = `
    <div class="section-header">
      <h1 class="section-title">Преподаватели</h1>
      <p class="section-description">Управление преподавателями</p>
    </div>

    <div class="card">
      <h3 class="card-title">Заголовки секции</h3>
      <form id="teachers-header-form">
        <div class="form-group">
          <label class="form-label">Заголовок</label>
          <input type="text" class="form-input" name="title" value="${teachersContent.title || ''}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Подзаголовок</label>
          <input type="text" class="form-input" name="subtitle" value="${teachersContent.subtitle || ''}" required />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-success">Сохранить</button>
        </div>
      </form>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Список преподавателей</h3>
        <button class="btn btn-primary btn-small" id="add-teacher-btn">+ Добавить преподавателя</button>
      </div>
      <div id="teachers-list">
        ${teachers.map(teacher => `
          <div class="list-item" data-id="${teacher.id}">
            <div class="list-item-content">
              <div class="list-item-title">${teacher.name}</div>
              <div class="list-item-description">${teacher.bio}</div>
            </div>
            <div class="list-item-actions">
              <button class="btn btn-secondary btn-small edit-teacher-btn" data-id="${teacher.id}">Редактировать</button>
              <button class="btn btn-danger btn-small delete-teacher-btn" data-id="${teacher.id}">Удалить</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div id="teacher-modal" style="display: none;"></div>
  `;

  document.getElementById('content-area').innerHTML = html;

  document.getElementById('teachers-header-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      await api.updateSiteContent('teachers', 'title', formData.get('title'));
      await api.updateSiteContent('teachers', 'subtitle', formData.get('subtitle'));
      showNotification('Заголовки обновлены', 'success');
    } catch (error) {
      showNotification('Ошибка сохранения', 'error');
    }
  });

  document.getElementById('add-teacher-btn').addEventListener('click', () => showTeacherModal());

  document.querySelectorAll('.edit-teacher-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const teacherId = btn.dataset.id;
      const teacher = teachers.find(t => t.id === teacherId);
      showTeacherModal(teacher);
    });
  });

  document.querySelectorAll('.delete-teacher-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Удалить этого преподавателя?')) {
        try {
          await api.deleteTeacher(btn.dataset.id);
          showNotification('Преподаватель удален', 'success');
          renderCurrentSection();
        } catch (error) {
          showNotification('Ошибка удаления', 'error');
        }
      }
    });
  });
}

function showTeacherModal(teacher = null) {
  const isEdit = !!teacher;

  const modalHtml = `
    <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
      <div style="background: var(--color-bg-secondary); padding: var(--spacing-xl); border-radius: var(--radius-lg); max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;">
        <h3 class="card-title">${isEdit ? 'Редактировать' : 'Добавить'} преподавателя</h3>
        <form id="teacher-form">
          <div class="form-group">
            <label class="form-label">Имя</label>
            <input type="text" class="form-input" name="name" value="${teacher?.name || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Биография</label>
            <textarea class="form-textarea" name="bio" required>${teacher?.bio || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Ссылка на видео / Код iframe</label>
            <textarea class="form-input" id="teacher-video-url" name="video_url" rows="3" style="font-family: monospace; font-size: 12px; resize: vertical;" required>${teacher?.video_url || ''}</textarea>
            <div id="video-url-validation" style="display: none; margin-top: 8px; padding: 10px; border-radius: 4px; font-size: 13px;"></div>
            <div style="font-size: 12px; color: var(--color-text-secondary); margin-top: 8px; padding: 12px; background: rgba(52, 152, 219, 0.1); border-radius: 4px; border-left: 3px solid #3498db;">
              <p style="font-weight: 600; color: #3498db; margin-bottom: 8px;">💡 Как добавить VK видео:</p>
              <ol style="margin: 8px 0 0 20px; padding: 0;">
                <li style="margin-bottom: 6px;">Откройте видео на VK</li>
                <li style="margin-bottom: 6px;">Нажмите "Поделиться" → "HTML-код" или "Скопировать код"</li>
                <li style="margin-bottom: 6px;"><strong>Вставьте весь iframe код</strong> или только ссылку из атрибута src</li>
              </ol>
              <p style="margin-top: 12px; font-weight: 600;">✅ Принимаемые форматы:</p>
              <ul style="margin: 8px 0 0 20px; padding: 0; list-style: none;">
                <li style="margin-bottom: 6px;">✓ Весь iframe: <code style="background: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 3px; font-size: 11px; display: block; margin-top: 4px;">&lt;iframe src="https://vkvideo.ru/video_ext.php?oid=-157301945&id=456239025&hash=0998d1d02641da56"...&gt;&lt;/iframe&gt;</code></li>
                <li style="margin-bottom: 6px;">✓ Только ссылка: <code style="background: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 3px; font-size: 11px; display: block; margin-top: 4px;">https://vkvideo.ru/video_ext.php?oid=-157301945&id=456239025&hash=0998d1d02641da56</code></li>
              </ul>
              <p style="margin-top: 12px; padding: 8px; background: rgba(46, 204, 113, 0.1); border-radius: 3px; color: #27ae60;">
                <strong>Важно:</strong> Ссылка должна содержать параметры <code>oid</code>, <code>id</code> и <code>hash</code> для корректной работы видео.
              </p>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Платформа</label>
            <select class="form-select" name="video_platform">
              <option value="vk" ${teacher?.video_platform === 'vk' ? 'selected' : ''}>VK</option>
              <option value="youtube" ${teacher?.video_platform === 'youtube' ? 'selected' : ''}>YouTube</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Порядок отображения</label>
            <input type="number" class="form-input" name="order_index" value="${teacher?.order_index || 0}" required />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-success">${isEdit ? 'Сохранить' : 'Добавить'}</button>
            <button type="button" class="btn btn-secondary" id="close-modal">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const modal = document.getElementById('teacher-modal');
  modal.innerHTML = modalHtml;
  modal.style.display = 'block';

  document.getElementById('close-modal').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  const videoUrlInput = document.getElementById('teacher-video-url');
  const platformSelect = document.querySelector('select[name="video_platform"]');
  const validationDiv = document.getElementById('video-url-validation');

  function validateVideoUrl() {
    const url = videoUrlInput.value.trim();
    const platform = platformSelect.value;

    if (!url) {
      validationDiv.style.display = 'none';
      return true;
    }

    if (platform === 'vk') {
      const result = validateVkVideoUrlInAdmin(url);
      if (result.valid) {
        validationDiv.style.display = 'block';
        validationDiv.style.background = 'rgba(39, 174, 96, 0.1)';
        validationDiv.style.borderLeft = '3px solid #27ae60';
        validationDiv.style.color = '#27ae60';
        validationDiv.innerHTML = `✓ URL корректен. Обработанный URL: <code style="font-size: 11px; background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px;">${result.embedUrl}</code>`;
        return true;
      } else {
        validationDiv.style.display = 'block';
        validationDiv.style.background = 'rgba(231, 76, 60, 0.1)';
        validationDiv.style.borderLeft = '3px solid #e74c3c';
        validationDiv.style.color = '#e74c3c';
        validationDiv.innerHTML = `✗ ${result.error}`;
        return false;
      }
    } else {
      validationDiv.style.display = 'none';
      return true;
    }
  }

  videoUrlInput.addEventListener('input', validateVideoUrl);
  platformSelect.addEventListener('change', validateVideoUrl);

  if (videoUrlInput.value) {
    validateVideoUrl();
  }

  document.getElementById('teacher-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const platform = formData.get('video_platform');
    const videoUrl = formData.get('video_url');

    if (platform === 'vk') {
      const result = validateVkVideoUrlInAdmin(videoUrl);
      if (!result.valid) {
        showNotification(result.error, 'error');
        return;
      }
    }

    const teacherData = {
      name: formData.get('name'),
      bio: formData.get('bio'),
      video_url: videoUrl,
      video_platform: platform,
      order_index: parseInt(formData.get('order_index'))
    };

    try {
      if (isEdit) {
        await api.updateTeacher(teacher.id, teacherData);
        showNotification('Преподаватель обновлен', 'success');
      } else {
        await api.createTeacher(teacherData);
        showNotification('Преподаватель добавлен', 'success');
      }
      modal.style.display = 'none';
      renderCurrentSection();
    } catch (error) {
      showNotification('Ошибка сохранения', 'error');
    }
  });
}

async function renderReviewsSection() {
  const [content, reviews] = await Promise.all([
    api.getSiteContent(),
    api.getReviews()
  ]);

  const reviewsContent = content.reviews || {};

  const html = `
    <div class="section-header">
      <h1 class="section-title">Отзывы</h1>
      <p class="section-description">Управление отзывами студентов</p>
    </div>

    <div class="card">
      <h3 class="card-title">Заголовки секции</h3>
      <form id="reviews-header-form">
        <div class="form-group">
          <label class="form-label">Заголовок</label>
          <input type="text" class="form-input" name="title" value="${reviewsContent.title || ''}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Заголовок логотипов</label>
          <input type="text" class="form-input" name="logos_title" value="${reviewsContent.logos_title || ''}" required />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-success">Сохранить</button>
        </div>
      </form>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Видео отзывы</h3>
        <button class="btn btn-primary btn-small" id="add-review-btn">+ Добавить отзыв</button>
      </div>
      <div id="reviews-list">
        ${reviews.map(review => `
          <div class="list-item" data-id="${review.id}">
            <div class="list-item-content">
              <div class="list-item-title">${review.video_platform.toUpperCase()}</div>
              <div class="list-item-description">${review.video_url}</div>
            </div>
            <div class="list-item-actions">
              <button class="btn btn-secondary btn-small edit-review-btn" data-id="${review.id}">Редактировать</button>
              <button class="btn btn-danger btn-small delete-review-btn" data-id="${review.id}">Удалить</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div id="review-modal" style="display: none;"></div>
  `;

  document.getElementById('content-area').innerHTML = html;

  document.getElementById('reviews-header-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      await api.updateSiteContent('reviews', 'title', formData.get('title'));
      await api.updateSiteContent('reviews', 'logos_title', formData.get('logos_title'));
      showNotification('Заголовки обновлены', 'success');
    } catch (error) {
      showNotification('Ошибка сохранения', 'error');
    }
  });

  document.getElementById('add-review-btn').addEventListener('click', () => showReviewModal());

  document.querySelectorAll('.edit-review-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const reviewId = btn.dataset.id;
      const review = reviews.find(r => r.id === reviewId);
      showReviewModal(review);
    });
  });

  document.querySelectorAll('.delete-review-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Удалить этот отзыв?')) {
        try {
          await api.deleteReview(btn.dataset.id);
          showNotification('Отзыв удален', 'success');
          renderCurrentSection();
        } catch (error) {
          showNotification('Ошибка удаления', 'error');
        }
      }
    });
  });
}

function showReviewModal(review = null) {
  const isEdit = !!review;

  const modalHtml = `
    <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
      <div style="background: var(--color-bg-secondary); padding: var(--spacing-xl); border-radius: var(--radius-lg); max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;">
        <h3 class="card-title">${isEdit ? 'Редактировать' : 'Добавить'} отзыв</h3>
        <form id="review-form">
          <div class="form-group">
            <label class="form-label">Ссылка на видео / Код iframe</label>
            <textarea class="form-input" id="review-video-url" name="video_url" rows="3" style="font-family: monospace; font-size: 12px; resize: vertical;" required>${review?.video_url || ''}</textarea>
            <div id="review-url-validation" style="display: none; margin-top: 8px; padding: 10px; border-radius: 4px; font-size: 13px;"></div>
            <div style="font-size: 12px; color: var(--color-text-secondary); margin-top: 8px; padding: 12px; background: rgba(52, 152, 219, 0.1); border-radius: 4px; border-left: 3px solid #3498db;">
              <p style="font-weight: 600; color: #3498db; margin-bottom: 8px;">💡 Как добавить VK видео:</p>
              <ol style="margin: 8px 0 0 20px; padding: 0;">
                <li style="margin-bottom: 6px;">Откройте видео на VK</li>
                <li style="margin-bottom: 6px;">Нажмите "Поделиться" → "HTML-код" или "Скопировать код"</li>
                <li style="margin-bottom: 6px;"><strong>Вставьте весь iframe код</strong> или только ссылку из атрибута src</li>
              </ol>
              <p style="margin-top: 12px; font-weight: 600;">✅ Принимаемые форматы:</p>
              <ul style="margin: 8px 0 0 20px; padding: 0; list-style: none;">
                <li style="margin-bottom: 6px;">✓ Весь iframe: <code style="background: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 3px; font-size: 11px; display: block; margin-top: 4px;">&lt;iframe src="https://vkvideo.ru/video_ext.php?oid=-157301945&id=456239025&hash=0998d1d02641da56"...&gt;&lt;/iframe&gt;</code></li>
                <li style="margin-bottom: 6px;">✓ Только ссылка: <code style="background: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 3px; font-size: 11px; display: block; margin-top: 4px;">https://vkvideo.ru/video_ext.php?oid=-157301945&id=456239025&hash=0998d1d02641da56</code></li>
              </ul>
              <p style="margin-top: 12px; padding: 8px; background: rgba(46, 204, 113, 0.1); border-radius: 3px; color: #27ae60;">
                <strong>Важно:</strong> Ссылка должна содержать параметры <code>oid</code>, <code>id</code> и <code>hash</code> для корректной работы видео.
              </p>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Платформа</label>
            <select class="form-select" name="video_platform">
              <option value="youtube" ${review?.video_platform === 'youtube' ? 'selected' : ''}>YouTube</option>
              <option value="vk" ${review?.video_platform === 'vk' ? 'selected' : ''}>VK</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Порядок отображения</label>
            <input type="number" class="form-input" name="order_index" value="${review?.order_index || 0}" required />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-success">${isEdit ? 'Сохранить' : 'Добавить'}</button>
            <button type="button" class="btn btn-secondary" id="close-modal">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const modal = document.getElementById('review-modal');
  modal.innerHTML = modalHtml;
  modal.style.display = 'block';

  document.getElementById('close-modal').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  const reviewUrlInput = document.getElementById('review-video-url');
  const reviewPlatformSelect = document.querySelector('select[name="video_platform"]');
  const reviewValidationDiv = document.getElementById('review-url-validation');

  function validateReviewVideoUrl() {
    const url = reviewUrlInput.value.trim();
    const platform = reviewPlatformSelect.value;

    if (!url) {
      reviewValidationDiv.style.display = 'none';
      return true;
    }

    if (platform === 'vk') {
      const result = validateVkVideoUrlInAdmin(url);
      if (result.valid) {
        reviewValidationDiv.style.display = 'block';
        reviewValidationDiv.style.background = 'rgba(39, 174, 96, 0.1)';
        reviewValidationDiv.style.borderLeft = '3px solid #27ae60';
        reviewValidationDiv.style.color = '#27ae60';
        reviewValidationDiv.innerHTML = `✓ URL корректен. Обработанный URL: <code style="font-size: 11px; background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px;">${result.embedUrl}</code>`;
        return true;
      } else {
        reviewValidationDiv.style.display = 'block';
        reviewValidationDiv.style.background = 'rgba(231, 76, 60, 0.1)';
        reviewValidationDiv.style.borderLeft = '3px solid #e74c3c';
        reviewValidationDiv.style.color = '#e74c3c';
        reviewValidationDiv.innerHTML = `✗ ${result.error}`;
        return false;
      }
    } else {
      reviewValidationDiv.style.display = 'none';
      return true;
    }
  }

  reviewUrlInput.addEventListener('input', validateReviewVideoUrl);
  reviewPlatformSelect.addEventListener('change', validateReviewVideoUrl);

  if (reviewUrlInput.value) {
    validateReviewVideoUrl();
  }

  document.getElementById('review-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const platform = formData.get('video_platform');
    const videoUrl = formData.get('video_url');

    if (platform === 'vk') {
      const result = validateVkVideoUrlInAdmin(videoUrl);
      if (!result.valid) {
        showNotification(result.error, 'error');
        return;
      }
    }

    const reviewData = {
      video_url: videoUrl,
      video_platform: platform,
      order_index: parseInt(formData.get('order_index'))
    };

    try {
      if (isEdit) {
        await api.updateReview(review.id, reviewData);
        showNotification('Отзыв обновлен', 'success');
      } else {
        await api.createReview(reviewData);
        showNotification('Отзыв добавлен', 'success');
      }
      modal.style.display = 'none';
      renderCurrentSection();
    } catch (error) {
      showNotification('Ошибка сохранения', 'error');
    }
  });
}

async function renderContactsSection() {
  const [content, contacts] = await Promise.all([
    api.getSiteContent(),
    api.getContacts()
  ]);

  const contactsContent = content.contacts || {};

  const html = `
    <div class="section-header">
      <h1 class="section-title">Контакты</h1>
      <p class="section-description">Управление контактной информацией</p>
    </div>

    <div class="card">
      <h3 class="card-title">Заголовок секции</h3>
      <form id="contacts-header-form">
        <div class="form-group">
          <label class="form-label">Заголовок</label>
          <input type="text" class="form-input" name="title" value="${contactsContent.title || ''}" required />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-success">Сохранить</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h3 class="card-title">Контактная информация</h3>
      <div id="contacts-list">
        ${contacts.map(contact => `
          <div class="list-item" data-id="${contact.id}">
            <div class="list-item-content">
              <div class="list-item-title">${contact.label}</div>
              <div class="list-item-description">${contact.value}</div>
            </div>
            <div class="list-item-actions">
              <button class="btn btn-secondary btn-small edit-contact-btn" data-id="${contact.id}">Редактировать</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div id="contact-modal" style="display: none;"></div>
  `;

  document.getElementById('content-area').innerHTML = html;

  document.getElementById('contacts-header-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      await api.updateSiteContent('contacts', 'title', formData.get('title'));
      showNotification('Заголовок обновлен', 'success');
    } catch (error) {
      showNotification('Ошибка сохранения', 'error');
    }
  });

  document.querySelectorAll('.edit-contact-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const contactId = btn.dataset.id;
      const contact = contacts.find(c => c.id === contactId);
      showContactModal(contact);
    });
  });
}

function showContactModal(contact) {
  const modalHtml = `
    <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
      <div style="background: var(--color-bg-secondary); padding: var(--spacing-xl); border-radius: var(--radius-lg); max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;">
        <h3 class="card-title">Редактировать контакт</h3>
        <form id="contact-form">
          <div class="form-group">
            <label class="form-label">Название</label>
            <input type="text" class="form-input" name="label" value="${contact.label}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Значение</label>
            <input type="text" class="form-input" name="value" value="${contact.value}" required />
          </div>
          <div class="form-group">
            <label class="form-label">URL (опционально)</label>
            <input type="text" class="form-input" name="url" value="${contact.url || ''}" />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-success">Сохранить</button>
            <button type="button" class="btn btn-secondary" id="close-modal">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const modal = document.getElementById('contact-modal');
  modal.innerHTML = modalHtml;
  modal.style.display = 'block';

  document.getElementById('close-modal').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  document.getElementById('contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const contactData = {
      label: formData.get('label'),
      value: formData.get('value'),
      url: formData.get('url') || null
    };

    try {
      await api.updateContact(contact.id, contactData);
      showNotification('Контакт обновлен', 'success');
      modal.style.display = 'none';
      renderCurrentSection();
    } catch (error) {
      showNotification('Ошибка сохранения', 'error');
    }
  });
}

async function renderLogosSection() {
  const logos = await api.getCompanyLogos();

  const html = `
    <div class="section-header">
      <h1 class="section-title">Логотипы компаний</h1>
      <p class="section-description">Управление логотипами компаний-работодателей</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Логотипы</h3>
        <button class="btn btn-primary btn-small" id="add-logo-btn">+ Добавить логотип</button>
      </div>
      <div id="logos-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px;">
        ${logos.map(logo => `
          <div class="preview-item" data-id="${logo.id}">
            <img src="${logo.image_url}" alt="${logo.name}" class="preview-image" />
            <button class="preview-remove delete-logo-btn" data-id="${logo.id}">×</button>
          </div>
        `).join('')}
      </div>
    </div>

    <div id="logo-modal" style="display: none;"></div>
  `;

  document.getElementById('content-area').innerHTML = html;

  document.getElementById('add-logo-btn').addEventListener('click', () => showLogoModal());

  document.querySelectorAll('.delete-logo-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Удалить этот логотип?')) {
        try {
          await api.deleteCompanyLogo(btn.dataset.id);
          showNotification('Логотип удален', 'success');
          renderCurrentSection();
        } catch (error) {
          showNotification('Ошибка удаления', 'error');
        }
      }
    });
  });
}

function showLogoModal() {
  const modalHtml = `
    <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
      <div style="background: var(--color-bg-secondary); padding: var(--spacing-xl); border-radius: var(--radius-lg); max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;">
        <h3 class="card-title">Добавить логотип</h3>
        <form id="logo-form">
          <div class="form-group">
            <label class="form-label">Название компании</label>
            <input type="text" class="form-input" name="name" required />
          </div>
          <div class="form-group">
            <label class="form-label">Изображение</label>
            <div class="upload-area" id="logo-upload-area">
              <svg class="upload-icon" viewBox="0 0 48 48" fill="none">
                <path d="M24 12v24M12 24h24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <p class="upload-text">Перетащите изображение или нажмите для выбора</p>
            </div>
            <input type="file" id="logo-image-input" accept="image/*" style="display: none;" required />
            <div id="logo-preview" class="image-preview"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Порядок отображения</label>
            <input type="number" class="form-input" name="order_index" value="0" required />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-success">Добавить</button>
            <button type="button" class="btn btn-secondary" id="close-modal">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const modal = document.getElementById('logo-modal');
  modal.innerHTML = modalHtml;
  modal.style.display = 'block';

  let selectedFile = null;

  setupImageUpload('logo-upload-area', 'logo-image-input', 'logo-preview', (file) => {
    selectedFile = file;
  });

  document.getElementById('close-modal').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  document.getElementById('logo-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      showNotification('Выберите изображение', 'error');
      return;
    }

    const formData = new FormData(e.target);

    try {
      const { publicUrl } = await api.uploadImage(selectedFile, 'logo');

      const logoData = {
        name: formData.get('name'),
        image_url: publicUrl,
        order_index: parseInt(formData.get('order_index'))
      };

      await api.createCompanyLogo(logoData);
      showNotification('Логотип добавлен', 'success');
      modal.style.display = 'none';
      renderCurrentSection();
    } catch (error) {
      showNotification('Ошибка сохранения', 'error');
    }
  });
}

function setupImageUpload(areaId, inputId, previewId, onFileSelect) {
  const uploadArea = document.getElementById(areaId);
  const fileInput = document.getElementById(inputId);
  const preview = document.getElementById(previewId);

  uploadArea.addEventListener('click', () => fileInput.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragging');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragging');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragging');

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  });

  function handleFileSelect(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.innerHTML = `
        <div class="preview-item">
          <img src="${e.target.result}" alt="Preview" class="preview-image" />
        </div>
      `;
    };
    reader.readAsDataURL(file);

    if (onFileSelect) {
      onFileSelect(file);
    }
  }
}

async function renderDocumentsSection() {
  const documents = await api.getDocuments();

  const html = `
    <div class="section-header">
      <h1 class="section-title">Документы</h1>
      <p class="section-description">Управление документами для скачивания</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Список документов</h3>
        <button class="btn btn-primary btn-small" id="add-document-btn">+ Добавить документ</button>
      </div>
      <div id="documents-list">
        ${documents.map(doc => `
          <div class="list-item" data-id="${doc.id}">
            <div class="list-item-content">
              <div class="list-item-title">${doc.title}</div>
              <div class="list-item-description">${doc.file_name}</div>
            </div>
            <div class="list-item-actions">
              <a href="${doc.file_url}" target="_blank" class="btn btn-secondary btn-small">Открыть</a>
              <button class="btn btn-secondary btn-small edit-document-btn" data-id="${doc.id}">Редактировать</button>
              <button class="btn btn-danger btn-small delete-document-btn" data-id="${doc.id}">Удалить</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div id="document-modal" style="display: none;"></div>
  `;

  document.getElementById('content-area').innerHTML = html;

  document.getElementById('add-document-btn').addEventListener('click', () => showDocumentModal());

  document.querySelectorAll('.edit-document-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const docId = btn.dataset.id;
      const doc = documents.find(d => d.id === docId);
      showDocumentModal(doc);
    });
  });

  document.querySelectorAll('.delete-document-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Удалить этот документ?')) {
        try {
          await api.deleteDocument(btn.dataset.id);
          showNotification('Документ удален', 'success');
          renderCurrentSection();
        } catch (error) {
          showNotification('Ошибка удаления', 'error');
        }
      }
    });
  });
}

function showDocumentModal(document = null) {
  const isEdit = !!document;

  const modalHtml = `
    <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
      <div style="background: var(--color-bg-secondary); padding: var(--spacing-xl); border-radius: var(--radius-lg); max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;">
        <h3 class="card-title">${isEdit ? 'Редактировать' : 'Добавить'} документ</h3>
        <form id="document-form">
          <div class="form-group">
            <label class="form-label">Название документа</label>
            <input type="text" class="form-input" name="title" value="${document?.title || ''}" required />
          </div>
          ${!isEdit ? `
          <div class="form-group">
            <label class="form-label">Файл</label>
            <div class="upload-area" id="document-upload-area">
              <svg class="upload-icon" viewBox="0 0 48 48" fill="none">
                <path d="M24 12v24M12 24h24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <p class="upload-text">Перетащите файл или нажмите для выбора</p>
              <p class="upload-hint">PDF, DOC, DOCX до 10MB</p>
            </div>
            <input type="file" id="document-file-input" accept=".pdf,.doc,.docx" style="display: none;" required />
            <div id="document-preview" class="image-preview"></div>
          </div>
          ` : ''}
          <div class="form-group">
            <label class="form-label">Порядок отображения</label>
            <input type="number" class="form-input" name="order_index" value="${document?.order_index || 0}" required />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-success">${isEdit ? 'Сохранить' : 'Добавить'}</button>
            <button type="button" class="btn btn-secondary" id="close-modal">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  `;

  let modal = document.getElementById('document-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'document-modal';
    document.body.appendChild(modal);
  }
  modal.innerHTML = modalHtml;
  modal.style.display = 'block';

  let selectedFile = null;

  modal.querySelector('#close-modal').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  if (!isEdit) {
    setupDocumentUpload('document-upload-area', 'document-file-input', 'document-preview', (file) => {
      selectedFile = file;
    });
  }

  modal.querySelector('#document-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Сохранение...';

      if (isEdit) {
        const docData = {
          title: formData.get('title'),
          order_index: parseInt(formData.get('order_index'))
        };
        await api.updateDocument(document.id, docData);
        showNotification('Документ обновлен', 'success');
      } else {
        if (!selectedFile) {
          showNotification('Выберите файл', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          return;
        }

        console.log('Uploading file:', selectedFile.name, selectedFile.size);
        const uploadResult = await api.uploadDocument(selectedFile);
        console.log('Upload result:', uploadResult);

        if (!uploadResult || !uploadResult.publicUrl) {
          throw new Error('Не удалось получить URL загруженного файла');
        }

        const docData = {
          title: formData.get('title'),
          file_url: uploadResult.publicUrl,
          file_name: selectedFile.name,
          order_index: parseInt(formData.get('order_index'))
        };

        console.log('Creating document with data:', docData);
        await api.createDocument(docData);
        showNotification('Документ добавлен', 'success');
      }
      modal.style.display = 'none';
      renderCurrentSection();
    } catch (error) {
      console.error('Error saving document:', error);
      showNotification(`Ошибка сохранения: ${error.message}`, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

function setupDocumentUpload(areaId, inputId, previewId, onFileSelect) {
  setTimeout(() => {
    const uploadArea = document.getElementById(areaId);
    const fileInput = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    if (!uploadArea || !fileInput || !preview) {
      console.error('Upload elements not found:', {
        areaId,
        inputId,
        previewId,
        uploadArea: !!uploadArea,
        fileInput: !!fileInput,
        preview: !!preview
      });
      return;
    }

    console.log('Setting up document upload handlers');

    uploadArea.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Upload area clicked');
      fileInput.click();
    });

    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragging');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragging');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragging');

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      console.log('File selected:', file);
      if (file) {
        handleFileSelect(file);
      }
    });

    function handleFileSelect(file) {
      console.log('Handling file:', file.name, file.type, file.size);
      preview.innerHTML = `
        <div class="preview-item">
          <div style="padding: 20px; text-align: center;">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style="margin: 0 auto; color: var(--color-primary);">
              <path d="M12 6a2 2 0 012-2h16l8 8v28a2 2 0 01-2 2H14a2 2 0 01-2-2V6z" stroke="currentColor" stroke-width="2"/>
              <path d="M30 4v8h8" stroke="currentColor" stroke-width="2"/>
            </svg>
            <p style="margin-top: 10px; font-weight: 500;">${file.name}</p>
            <p style="color: var(--color-text-secondary); font-size: 14px;">${(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>
      `;

      if (onFileSelect) {
        onFileSelect(file);
      }
    }
  }, 100);
}

function extractVkEmbedUrlInAdmin(input) {
  if (!input) return null;

  input = input.trim();

  // Если вставлен весь iframe код - извлекаем src
  if (input.includes('<iframe')) {
    const srcMatch = input.match(/src=["']([^"']+)["']/i);
    if (srcMatch) {
      return srcMatch[1];
    }
  }

  // Иначе считаем что это уже embed URL
  return input;
}

function validateVkVideoUrlInAdmin(url) {
  if (!url) {
    return { valid: false, error: 'URL не может быть пустым' };
  }

  // Извлекаем URL из iframe кода, если он там есть
  url = extractVkEmbedUrlInAdmin(url);
  if (!url) {
    return { valid: false, error: 'Не удалось извлечь URL из iframe кода' };
  }

  url = url.trim();

  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }

  // Проверяем что это embed URL от VK
  if (!url.includes('video_ext.php')) {
    return {
      valid: false,
      error: 'Неверный формат. Используйте embed-ссылку с video_ext.php или весь iframe код от VK'
    };
  }

  try {
    const urlObj = new URL(url);
    const oid = urlObj.searchParams.get('oid');
    const id = urlObj.searchParams.get('id');
    const hash = urlObj.searchParams.get('hash');

    if (!oid || !id) {
      return {
        valid: false,
        error: 'URL должен содержать параметры oid и id'
      };
    }

    if (!hash) {
      return {
        valid: false,
        error: 'URL не содержит обязательный параметр hash. Видео может не работать без него!'
      };
    }

    // Добавляем hd=2 если отсутствует
    if (!urlObj.searchParams.has('hd')) {
      urlObj.searchParams.set('hd', '2');
    }

    return {
      valid: true,
      embedUrl: urlObj.toString()
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Некорректный URL: ' + error.message
    };
  }
}

function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  const messageEl = notification.querySelector('.notification-message');

  messageEl.textContent = message;
  notification.className = `notification ${type}`;
  notification.style.display = 'block';

  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
}

init();
