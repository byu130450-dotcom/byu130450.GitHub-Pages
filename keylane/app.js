import { totp } from './totp.mjs';

const $ = id => document.getElementById(id);
const secret = $('secret');
const remember = $('remember');
const KEY = 'keylane.secret';
const PREF = 'keylane.remember';
const hint = '支持 Base32 密钥，自动忽略空格。';
let version = 0, current = '', currentStep = -1, requestedStep = -1;
let toastTimer, inputTimer, copiedTimer;

function toast(message) {
  $('toast').textContent = message;
  $('toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2600);
}
function storageStatus(text, failed = false) {
  $('saved-state').textContent = text;
  $('saved-state').classList.toggle('storage-error', failed);
}
function persist(valid = false) {
  try {
    localStorage.setItem(PREF, String(remember.checked));
    if (!remember.checked || !secret.value.trim()) {
      localStorage.removeItem(KEY);
      storageStatus(remember.checked ? '下次打开，自动恢复密钥' : '仅在本次页面中使用');
    } else if (valid) {
      localStorage.setItem(KEY, secret.value.toUpperCase().replace(/\s/g, ''));
      storageStatus('已保存在此浏览器');
    }
    return true;
  } catch {
    storageStatus('浏览器存储不可用，请勿依赖自动保存', true);
    return false;
  }
}
function clearCopyFeedback() {
  clearTimeout(copiedTimer);
  $('copy-label').textContent = '复制验证码';
  $('copy').classList.remove('copied');
}
function reset() {
  current = '';
  currentStep = -1;
  $('code').textContent = '··· ···';
  $('copy').disabled = true;
  $('badge').textContent = '等待密钥';
  $('countdown').textContent = '输入密钥后自动生成';
  $('ring').style.strokeDashoffset = '94.25';
  $('progress').style.transform = 'scaleX(0)';
  $('output').dataset.state = 'empty';
  $('output').classList.remove('expiring');
  clearCopyFeedback();
}
function hideSecret() {
  secret.type = 'password';
  $('reveal').textContent = '显示';
  $('reveal').setAttribute('aria-label', '显示密钥');
  $('reveal').setAttribute('aria-pressed', 'false');
}
function showError(message) {
  reset();
  $('error').textContent = message;
  $('error').className = 'hint error';
  secret.setAttribute('aria-invalid', 'true');
  $('badge').textContent = '检查密钥';
  $('output').dataset.state = 'error';
}
async function update({ save = false } = {}) {
  const revision = ++version;
  const value = secret.value;
  const time = Date.now();
  const step = Math.floor(time / 30000);
  requestedStep = step;
  if (!value.trim()) { reset(); return; }
  try {
    if (!globalThis.crypto?.subtle) throw Error('当前浏览器不支持生成验证码，请使用新版浏览器打开。');
    const code = await totp(value, time);
    if (revision !== version) return;
    if (Math.floor(Date.now() / 30000) !== step) { return update({ save }); }
    if (current && current !== code) clearCopyFeedback();
    current = code;
    currentStep = step;
    $('code').textContent = code.slice(0, 3) + ' ' + code.slice(3);
    $('copy').disabled = false;
    $('badge').textContent = '实时更新';
    $('output').dataset.state = 'ready';
    $('error').textContent = hint;
    $('error').className = 'hint';
    secret.setAttribute('aria-invalid', 'false');
    if (save) persist(true);
    tick();
  } catch (error) {
    if (revision !== version) return;
    showError(error.message);
    if (save && remember.checked) storageStatus('格式有误，未覆盖之前保存的密钥');
  }
}
function tick() {
  if (!current) return;
  const step = Math.floor(Date.now() / 30000);
  if (step !== currentStep) {
    // A stale code is never presented as usable during an async refresh.
    $('copy').disabled = true;
    $('badge').textContent = '正在更新';
    if (step !== requestedStep) update();
    return;
  }
  const left = 30 - Math.floor(Date.now() / 1000) % 30;
  $('countdown').textContent = left <= 5 ? left + ' 秒后更新，请及时使用' : left + ' 秒后更新';
  $('ring').style.strokeDashoffset = String(94.25 * (1 - left / 30));
  $('progress').style.transform = 'scaleX(' + left / 30 + ')';
  $('output').classList.toggle('expiring', left <= 5);
}
function legacyCopy(text) {
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.cssText = 'position:fixed;left:-9999px;top:0;font-size:16px';
  const previous = document.activeElement;
  document.body.appendChild(field);
  field.select();
  field.setSelectionRange(0, text.length);
  let ok = false;
  try { ok = document.execCommand('copy'); }
  finally { field.remove(); previous?.focus({ preventScroll: true }); }
  return ok;
}
async function writeClipboard(text) {
  try {
    if (!navigator.clipboard?.writeText) throw Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try { return legacyCopy(text); } catch { return false; }
  }
}
secret.addEventListener('input', () => {
  ++version;
  clearTimeout(inputTimer);
  reset();
  $('error').textContent = hint;
  $('error').className = 'hint';
  secret.setAttribute('aria-invalid', 'false');
  if (!secret.value.trim()) { persist(); return; }
  if (remember.checked) storageStatus('验证后自动保存');
  inputTimer = setTimeout(() => update({ save: true }), 220);
});
remember.addEventListener('change', () => {
  if (persist(!!current)) toast(remember.checked ? '已开启本地记忆' : '已关闭记忆，保存的密钥已移除');
});
$('reveal').onclick = () => {
  if (secret.type === 'text') { hideSecret(); return; }
  secret.type = 'text';
  $('reveal').textContent = '隐藏';
  $('reveal').setAttribute('aria-label', '隐藏密钥');
  $('reveal').setAttribute('aria-pressed', 'true');
};
$('clear').onclick = () => {
  ++version;
  clearTimeout(inputTimer);
  secret.value = '';
  reset();
  hideSecret();
  $('error').textContent = hint;
  $('error').className = 'hint';
  secret.setAttribute('aria-invalid', 'false');
  const removed = persist();
  toast(removed ? '密钥与本地记录已清空' : '页面已清空，但无法删除浏览器记录');
  secret.focus();
};
$('copy').onclick = async () => {
  if (!current || $('copy').disabled) return;
  const revision = version;
  const copiedCode = current;
  const copiedStep = currentStep;
  if (Math.floor(Date.now() / 30000) !== copiedStep) { await update(); toast('验证码已更新，请重新复制'); return; }
  const ok = await writeClipboard(copiedCode);
  if (revision !== version) return;
  if (!ok) { toast('无法自动复制，请长按或选中验证码复制'); return; }
  if (Math.floor(Date.now() / 30000) !== copiedStep) { toast('刚复制的验证码已到期，请复制新验证码'); return; }
  clearCopyFeedback();
  $('copy-label').textContent = '已复制';
  $('copy').classList.add('copied');
  toast('验证码已复制');
  copiedTimer = setTimeout(clearCopyFeedback, 2200);
};
try {
  remember.checked = localStorage.getItem(PREF) !== 'false';
  if (remember.checked) secret.value = localStorage.getItem(KEY) || '';
  storageStatus(secret.value ? '已恢复上次的密钥' : remember.checked ? '下次打开，自动恢复密钥' : '仅在本次页面中使用');
} catch { storageStatus('浏览器存储不可用，请勿依赖自动保存', true); }
update();
setInterval(tick, 250);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hideSecret();
  else { clearTimeout(inputTimer); update({ save: true }); }
});
