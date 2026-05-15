function formatUserName(name) {
    if (!name) {
        return 'User';
    }

    return name
        .split(/\s+/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
}

function prettyLabel(value) {
    return String(value)
    .replace(/\.(png|jpg|jpeg|gif|webp|svg|pdf|html|ejagruti)$/i, '')
        .replace(/[_-]+/g, ' ')
        .trim();
}

function normalizePathSegment(value) {
    return String(value || '')
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[\\/:*?"<>|]+/g, '');
}

let menuCounter = 0;

function nextMenuId() {
    menuCounter += 1;
    return `easyMenu_${menuCounter}`;
}

function createLeafItem(value, trail) {
    const leaf = document.createElement('div');
    leaf.className = 'menu-item-content leaf-menu-item';
    leaf.textContent = prettyLabel(value);
    leaf.dataset.menuTrail = JSON.stringify(trail || []);
    leaf.dataset.leafValue = String(value);
    return leaf;
}

function buildNestedMenu(value, trail) {
    const submenu = document.createElement('div');
    submenu.style.width = '220px';

    if (Array.isArray(value)) {
        value.forEach((entry) => {
            if (entry !== null && typeof entry === 'object') {
                Object.entries(entry).forEach(([childLabel, childValue]) => {
                    const row = document.createElement('div');
                    row.className = 'menu-item-content group-menu-item';
                    row.textContent = prettyLabel(childLabel);
                    row.appendChild(buildNestedMenu(childValue, [...trail, childLabel]));
                    submenu.appendChild(row);
                });
            } else {
                submenu.appendChild(createLeafItem(entry, [...trail, entry]));
            }
        });
        return submenu;
    }

    if (value !== null && typeof value === 'object') {
        Object.entries(value).forEach(([childLabel, childValue]) => {
            const row = document.createElement('div');
            row.className = 'menu-item-content group-menu-item';
            row.textContent = prettyLabel(childLabel);
            row.appendChild(buildNestedMenu(childValue, [...trail, childLabel]));
            submenu.appendChild(row);
        });
        return submenu;
    }

    submenu.appendChild(createLeafItem(value, [...trail, value]));
    return submenu;
}

function createEasyMenu(label, value, pool) {
    const menuId = nextMenuId();
    const menuDiv = document.createElement('div');
    menuDiv.id = menuId;
    menuDiv.className = 'easyui-menu generated-easy-menu';
    menuDiv.style.width = '220px';

    const rootContent = buildNestedMenu(value, [label]);
    while (rootContent.firstChild) {
        menuDiv.appendChild(rootContent.firstChild);
    }

    pool.appendChild(menuDiv);
    return menuId;
}

function createPathCandidates(trail) {
    const cleanTrail = trail
        .map((segment) => String(segment || '').trim())
        .filter(Boolean);
    if (cleanTrail.length === 0) {
        return [];
    }

    const folderSegments = cleanTrail.slice(0, -1).map(normalizePathSegment);
    const lastSegment = cleanTrail[cleanTrail.length - 1];
    
    // Check if last segment already has an extension
    const hasExtension = /\.(png|jpg|jpeg|gif|webp|svg|pdf|html|ejagruti|xlsx|ipynb|py)$/i.test(lastSegment);
    
    if (hasExtension) {
        // If it has extension, use it directly and support pdf/ejagruti alias fallback.
        const fileName = normalizePathSegment(lastSegment);
        const basePath = `courses/${[...folderSegments].join('/')}`;
        const directPath = `${basePath}/${fileName}`;

        if (/\.pdf$/i.test(fileName)) {
            const aliasPath = directPath.replace(/\.pdf$/i, '.ejagruti');
            return [directPath, aliasPath];
        }

        if (/\.ejagruti$/i.test(fileName)) {
            const aliasPath = directPath.replace(/\.ejagruti$/i, '.pdf');
            return [directPath, aliasPath];
        }

        return [directPath];
    }
    
    // Otherwise, try multiple extensions
    const fileStem = normalizePathSegment(lastSegment);
    const base = ['courses', ...folderSegments, fileStem].join('/');
    const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.pdf', '.ejagruti', '.html','.xlsx','.ipynb','.py'];

    return extensions.map((ext) => `${base}${ext}`);
}

function checkFileExists(url) {
    return fetch(url, { method: 'HEAD' })
        .then((response) => {
            if (response.ok) {
                return url;
            }

            return fetch(url, { method: 'GET' }).then((getResponse) => (getResponse.ok ? url : null));
        })
        .catch(() => fetch(url, { method: 'GET' }).then((response) => (response.ok ? url : null)).catch(() => null));
}

function loadImageCandidate(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error('Not found'));
        img.src = url;
    });
}

async function resolveFirstExistingFile(candidates) {
    for (const url of candidates) {
        // For images, use Image object for faster checking
        if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(url)) {
            try {
                const found = await loadImageCandidate(url);
                return found;
            } catch (error) {
                // Continue checking next candidate.
            }
        } else {
            // For other files like PDF and HTML, use fetch HEAD request
            const exists = await checkFileExists(url);
            if (exists) return exists;
        }
    }
    return null;
}

function renderBottomError(message) {
    const host = document.getElementById('bottomContent');
    host.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'bottom-error';
    p.textContent = message;
    host.appendChild(p);
}

function renderBottomImage(pathLabel, imageUrl) {
    const host = document.getElementById('bottomContent');
    host.innerHTML = '';

    const path = document.createElement('p');
    path.className = 'bottom-path';
    path.textContent = `Opened: ${pathLabel}`;

    const img = document.createElement('img');
    img.className = 'bottom-preview-image';
    img.alt = pathLabel;
    img.src = imageUrl;

    host.appendChild(path);
    host.appendChild(img);
}

async function renderBottomPDF(pathLabel, pdfUrl) {
    const host = document.getElementById('bottomContent');
    host.innerHTML = '';

    const path = document.createElement('p');
    path.className = 'bottom-path';
    path.textContent = `Opened: ${pathLabel}`;

    const container = document.createElement('div');
    container.className = 'bottom-preview-pdf';

    host.appendChild(path);
    host.appendChild(container);

    const pdfjs = window.pdfjsLib;
    if (!pdfjs) {
        container.innerHTML = '<p class="bottom-error">PDF viewer is unavailable. Please refresh the page.</p>';
        return;
    }

    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

    try {
        let loadingTask;
        if (/\.ejagruti$/i.test(pdfUrl)) {
            const response = await fetch(pdfUrl);
            if (!response.ok) {
                throw new Error('Unable to load .ejagruti file');
            }
            const bytes = await response.arrayBuffer();
            loadingTask = pdfjs.getDocument({ data: bytes });
        } else {
            loadingTask = pdfjs.getDocument(pdfUrl);
        }

        const pdf = await loadingTask.promise;

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            const page = await pdf.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 1.3 });

            const pageWrap = document.createElement('div');
            pageWrap.className = 'pdf-page-wrap';

            const pageLabel = document.createElement('p');
            pageLabel.className = 'pdf-page-label';
            pageLabel.textContent = `Page ${pageNumber} of ${pdf.numPages}`;

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.className = 'pdf-canvas';

            pageWrap.appendChild(pageLabel);
            pageWrap.appendChild(canvas);
            container.appendChild(pageWrap);

            const context = canvas.getContext('2d');
            await page.render({ canvasContext: context, viewport }).promise;
        }
    } catch (error) {
        container.innerHTML = '';

        const iframe = document.createElement('iframe');
        iframe.src = `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`;
        iframe.style.width = '100%';
        iframe.style.height = '600px';
        iframe.style.border = 'none';
        container.appendChild(iframe);
    }
}

function renderBottomHTML(pathLabel, htmlUrl) {
    const host = document.getElementById('bottomContent');
    host.innerHTML = '';

    const path = document.createElement('p');
    path.className = 'bottom-path';
    path.textContent = `Opened: ${pathLabel}`;

    const iframe = document.createElement('iframe');
    iframe.className = 'bottom-preview-html';
    iframe.src = htmlUrl;
    iframe.style.width = '100%';
    iframe.style.height = '600px';
    iframe.style.border = 'none';

    host.appendChild(path);
    host.appendChild(iframe);
}

function buildDisplayPath(trail, resolvedFilePath) {
    const displayTrail = [...trail];
    if (displayTrail.length > 0 && /\.ejagruti$/i.test(resolvedFilePath)) {
        const lastIndex = displayTrail.length - 1;
        displayTrail[lastIndex] = String(displayTrail[lastIndex]).replace(/\.pdf$/i, '.ejagruti');
    }
    return displayTrail.join(' > ');
}

// async function handleLeafClick(leafNode) {
//     const trail = JSON.parse(leafNode.dataset.menuTrail || '[]');
//     const readablePath = trail.join(' > ');
//     const candidates = createPathCandidates(trail);

//     if (!candidates.length) {
//         renderBottomError('Unable to determine path from selected menu item.');
//         return;
//     }

//     const match = await resolveFirstExistingFile(candidates);
//     if (!match) {
//         renderBottomError(`No matching file found for ${readablePath}. Tried: ${candidates.join(', ')}`);
//         return;
//     }

//     const displayPath = buildDisplayPath(trail, match);

//     // Determine file type and render appropriately
//     if (/\.(pdf|ejagruti)$/i.test(match)) {
//         await renderBottomPDF(displayPath, match);
//     } else if (/\.html$/i.test(match)) {
//         renderBottomHTML(displayPath, match);
//     } else {
//         renderBottomImage(displayPath, match);
//     }
// }

function renderDynamicMenu(menuData) {
    const host = document.getElementById('dynamicMenu');
    const menusPool = document.body;
    const status = document.getElementById('menuStatus');

    host.innerHTML = '';
    document.querySelectorAll('.generated-easy-menu').forEach((node) => node.remove());
    menuCounter = 0;

    if (!menuData || typeof menuData !== 'object') {
        if (status) {
            status.textContent = 'Menu data is empty.';
        }
        return;
    }

    Object.entries(menuData).forEach(([label, value]) => {
        const rootMenuId = createEasyMenu(label, value, menusPool);

        const button = document.createElement('a');
        button.href = 'javascript:void(0)';
        button.className = 'easyui-menubutton';
        button.textContent = prettyLabel(label);
        button.setAttribute('data-options', `menu:'#${rootMenuId}'`);
        host.appendChild(button);
    });

    if (window.jQuery && window.jQuery.parser) {
        document.querySelectorAll('.generated-easy-menu').forEach((menuNode) => {
            window.jQuery.parser.parse(menuNode);
        });
        window.jQuery.parser.parse(host);

        const menuButtons = window.jQuery(host).find('.easyui-menubutton');
        menuButtons.menubutton({
            duration: 160,
            hasDownArrow: true
        });
        if (status) {
            status.textContent = 'jEasyUI menu loaded from resources/menu.json';
        }
    } else {
        if (status) {
            status.textContent = 'jEasyUI library not loaded.';
        }
    }
}

function loadMenuFromJson() {
    return fetch('resources/menu.json')
        .then((response) => {
            if (!response.ok) {
                throw new Error('Unable to load menu file.');
            }
            return response.json();
        })
        .then((menuData) => {
            renderDynamicMenu(menuData);
        })
        .catch(() => {
            const status = document.getElementById('menuStatus');
            if (status) {
                status.textContent = 'Failed to load resources/menu.json';
            }
        });
}

document.addEventListener('DOMContentLoaded', function() {
    const userEmail = sessionStorage.getItem('userEmail');
    const userName = sessionStorage.getItem('userName');
    const safeUserName = formatUserName(userName);

    if (!userEmail) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('navWelcome').textContent = `Welcome ${safeUserName}`;
    loadMenuFromJson();

    document.body.addEventListener('click', function(event) {
        const leaf = event.target.closest('.leaf-menu-item');
        if (!leaf) {
            return;
        }
        handleLeafClick(leaf);
    });

    const logoutLink = document.getElementById('logoutLink');
    logoutLink.addEventListener('click', function(event) {
        event.preventDefault();
        sessionStorage.clear();

        if (window.google && window.google.accounts) {
            window.google.accounts.id.disableAutoSelect();
        }

        window.location.href = 'index.html';
    });

    // Prevent right-click globally
    document.addEventListener('contextmenu', function(event) {
        event.preventDefault();
        return false;
    });

    // Prevent keyboard shortcuts for saving/downloading
    document.addEventListener('keydown', function(event) {
        // Prevent Ctrl+S (Save)
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            return false;
        }
        // Prevent Ctrl+P (Print)
        if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
            event.preventDefault();
            return false;
        }
    });

    // Disable drag and drop
    document.addEventListener('dragstart', function(event) {
        event.preventDefault();
        return false;
    });
});
// async function forceDownload(url) {
//     try {
//         const response = await fetch(url);
//         if (!response.ok) {
//             throw new Error('Download failed');
//         }

//         const blob = await response.blob();
//         const objectUrl = window.URL.createObjectURL(blob);

//         const link = document.createElement('a');
//         link.href = objectUrl;
//         link.download = url.split('/').pop(); // keep original filename
//         document.body.appendChild(link);
//         link.click();

//         document.body.removeChild(link);
//         window.URL.revokeObjectURL(objectUrl);
//     } catch (error) {
//              console.error(error);
//     }
// }
async function forceDownload(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) throw new Error();

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = url.split('/').pop();
    a.click();

    URL.revokeObjectURL(objectUrl);
  } catch {
    // fallback
    const a = document.createElement('a');
    a.href = url;
    a.download = url.split('/').pop();
    a.click();
  }
}

async function handleLeafClick(leafNode) {
    const trail = JSON.parse(leafNode.dataset.menuTrail || '[]');
    const candidates = createPathCandidates(trail);

    if (!candidates.length) {
        renderBottomError('Unable to determine file.');
        return;
    }

    const match = await resolveFirstExistingFile(candidates);
    if (!match) {
        renderBottomError('File not found.');
        return;
    }

    const displayPath = buildDisplayPath(trail, match);

    const extensionMatch = match.match(/\.([a-z0-9]+)$/i);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : '';

    const PREVIEW_EXTENSIONS = [
        'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg',
        'pdf', 'ejagruti', 'html'
    ];

    // ✅ FORCE DOWNLOAD for unsupported files
    if (!PREVIEW_EXTENSIONS.includes(extension)) {
        alert(extension)
        await forceDownload(match);
        return;
    }

    // ✅ Normal preview
    if (extension === 'pdf' || extension === 'ejagruti') {
        await renderBottomPDF(displayPath, match);
    } else if (extension === 'html') {
        renderBottomHTML(displayPath, match);
    } else {
        renderBottomImage(displayPath, match);
    }
}