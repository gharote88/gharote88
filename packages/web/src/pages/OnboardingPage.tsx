import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import {
  CakeIcon, UserCircleIcon, ChatsCircleIcon, TargetIcon, PaletteIcon,
  UsersIcon, MaskHappyIcon, BooksIcon, MapTrifoldIcon, ConfettiIcon,
  PersonSimpleIcon, SmileyIcon, SmileyWinkIcon, ShieldSlashIcon,
  ArrowLeftIcon, ArrowRightIcon, RocketIcon, CheckCircleIcon, CheckIcon, HandIcon,
} from '@phosphor-icons/react';

type Step = 0 | 1 | 2 | 3 | 4;

const NATIVE_LANGUAGES = ['Hindi', 'English', 'Gujarati', 'Kannada', 'Telugu', 'Tamil', 'Bengali', 'Punjabi', 'Other'];
const MOTIVATIONS = [
  { id: 'family',  label: 'Connect with family',    Icon: UsersIcon      },
  { id: 'culture', label: 'Explore culture',         Icon: MaskHappyIcon  },
  { id: 'school',  label: 'School / studies',        Icon: BooksIcon      },
  { id: 'travel',  label: 'Travel to Maharashtra',   Icon: MapTrifoldIcon },
  { id: 'fun',     label: 'Just for fun',            Icon: ConfettiIcon   },
];
const AVATARS = ['🦁', '🐯', '🦊', '🐻', '🦋', '🦚', '🐬', '🦜'];

const STEP_LABELS = ['Age', 'About You', 'Language', 'Goal', 'Avatar'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, setOnboardingComplete } = useAuthStore();

  const [step, setStep] = useState<Step>(0);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [nativeLang, setNativeLang] = useState('');
  const [motivation, setMotivation] = useState('');
  const [avatar, setAvatar] = useState('');
  const [saving, setSaving] = useState(false);

  const ageNum = parseInt(age, 10);
  const under13 = ageNum > 0 && ageNum < 13;

  const canNext: Record<Step, boolean> = {
    0: ageNum >= 5 && ageNum <= 100,
    1: gender !== '',
    2: nativeLang !== '',
    3: motivation !== '',
    4: avatar !== '',
  };

  async function finish() {
    if (!user || saving) return;
    setSaving(true);
    try {
      await supabase.from('users').update({
        age: ageNum,
        under_13: under13,
        gender,
        native_language: nativeLang,
        motivation,
        avatar_emoji: avatar,
        onboarding_complete: true,
      }).eq('id', user.id);
      setOnboardingComplete(true);
      navigate('/dashboard', { replace: true });
    } catch {
      setSaving(false);
    }
  }

  function next() {
    if (step < 4) setStep((step + 1) as Step);
    else finish();
  }

  function back() {
    if (step > 0) setStep((step - 1) as Step);
  }

  return (
    <div style={s.page}>
      {/* Progress bar */}
      <div style={s.progressWrap}>
        {STEP_LABELS.map((label, i) => (
          <div key={i} style={s.stepItem}>
            <div style={{ ...s.stepDot, ...(i <= step ? s.stepDotActive : {}) }}>
              {i < step ? <CheckIcon size={12} weight="bold" /> : i + 1}
            </div>
            <span style={{ ...s.stepLabel, ...(i === step ? s.stepLabelActive : {}) }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={s.card}>
        {/* Step 0: Age */}
        {step === 0 && (
          <div style={s.stepContent}>
            <div style={s.stepEmoji}><CakeIcon size={48} weight="duotone" color="var(--color-saffron)" /></div>
            <h2 style={s.stepTitle}>How old are you?</h2>
            <p style={s.stepSub}>We'll personalise your learning journey</p>
            <input
              type="number" min={5} max={100}
              value={age} onChange={e => setAge(e.target.value)}
              placeholder="Enter your age"
              style={s.input}
            />
            {under13 && (
              <p style={s.coppaNote}><HandIcon size={16} weight="fill" style={{ verticalAlign: 'middle', marginRight: 4 }} />A parent or guardian will need to approve your account.</p>
            )}
          </div>
        )}

        {/* Step 1: Gender */}
        {step === 1 && (
          <div style={s.stepContent}>
            <div style={s.stepEmoji}><UserCircleIcon size={48} weight="duotone" color="var(--color-teal)" /></div>
            <h2 style={s.stepTitle}>Tell us about yourself</h2>
            <p style={s.stepSub}>This helps us use the right pronouns</p>
            <div style={s.optionGrid}>
              {[
                { id: 'male',       label: 'He / Him',          Icon: PersonSimpleIcon  },
                { id: 'female',     label: 'She / Her',         Icon: SmileyWinkIcon    },
                { id: 'nonbinary',  label: 'They / Them',       Icon: SmileyIcon        },
                { id: 'prefer_not', label: 'Prefer not to say', Icon: ShieldSlashIcon   },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  style={{ ...s.optionBtn, ...(gender === id ? s.optionBtnActive : {}) }}
                  onClick={() => setGender(id)}
                >
                  <Icon size={28} weight="duotone" color={gender === id ? 'var(--color-teal)' : 'var(--color-text-muted)'} />
                  <span style={s.optionLabel}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Native Language */}
        {step === 2 && (
          <div style={s.stepContent}>
            <div style={s.stepEmoji}><ChatsCircleIcon size={48} weight="duotone" color="var(--color-teal)" /></div>
            <h2 style={s.stepTitle}>What's your native language?</h2>
            <p style={s.stepSub}>We'll explain concepts in your language</p>
            <div style={s.langGrid}>
              {NATIVE_LANGUAGES.map(lang => (
                <button
                  key={lang}
                  style={{ ...s.langBtn, ...(nativeLang === lang ? s.langBtnActive : {}) }}
                  onClick={() => setNativeLang(lang)}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Motivation */}
        {step === 3 && (
          <div style={s.stepContent}>
            <div style={s.stepEmoji}><TargetIcon size={48} weight="duotone" color="var(--color-saffron)" /></div>
            <h2 style={s.stepTitle}>Why are you learning Marathi?</h2>
            <p style={s.stepSub}>Pick the one that fits best</p>
            <div style={s.motivList}>
              {MOTIVATIONS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  style={{ ...s.motivBtn, ...(motivation === id ? s.motivBtnActive : {}) }}
                  onClick={() => setMotivation(id)}
                >
                  <Icon size={22} weight="duotone" color={motivation === id ? 'var(--color-teal)' : 'var(--color-text-muted)'} style={{ flexShrink: 0 }} />
                  <span style={s.motivLabel}>{label}</span>
                  {motivation === id && <CheckCircleIcon size={18} weight="fill" color="var(--color-teal)" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Avatar */}
        {step === 4 && (
          <div style={s.stepContent}>
            <div style={s.stepEmoji}><PaletteIcon size={48} weight="duotone" color="var(--color-teal)" /></div>
            <h2 style={s.stepTitle}>Pick your avatar</h2>
            <p style={s.stepSub}>You can change this anytime</p>
            <div style={s.avatarGrid}>
              {AVATARS.map(a => (
                <button
                  key={a}
                  style={{ ...s.avatarBtn, ...(avatar === a ? s.avatarBtnActive : {}) }}
                  onClick={() => setAvatar(a)}
                >
                  {a}
                </button>
              ))}
            </div>
            {avatar && (
              <div style={s.avatarPreview}>
                <span style={s.avatarPreviewEmoji}>{avatar}</span>
                <span style={s.avatarPreviewLabel}>Looking good!</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={s.navRow}>
        {step > 0
          ? <button style={s.backBtn} onClick={back}><ArrowLeftIcon size={16} weight="bold" style={{ verticalAlign: 'middle', marginRight: 4 }} />Back</button>
          : <div />
        }
        <button
          style={{ ...s.nextBtn, ...(!canNext[step] ? s.nextBtnDisabled : {}) }}
          disabled={!canNext[step] || saving}
          onClick={next}
        >
          {saving ? '...' : step === 4
            ? <><RocketIcon size={16} weight="fill" style={{ verticalAlign: 'middle', marginRight: 6 }} />Start Learning</>
            : <>Next <ArrowRightIcon size={16} weight="bold" style={{ verticalAlign: 'middle', marginLeft: 4 }} /></>}
        </button>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 480, margin: '0 auto', minHeight: '100vh',
    padding: '24px 16px 40px', fontFamily: 'var(--font-sans)',
    background: 'var(--color-bg)', display: 'flex', flexDirection: 'column',
  },
  progressWrap: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 28, position: 'relative',
  },
  stepItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 },
  stepDot: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'var(--color-border)', color: 'var(--color-text-muted)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, transition: 'all 0.2s',
  },
  stepDotActive: { background: 'var(--color-teal)', color: '#fff' },
  stepLabel: { fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 500 },
  stepLabelActive: { color: 'var(--color-teal)', fontWeight: 700 },
  card: {
    background: 'var(--color-surface)', borderRadius: 24,
    padding: '28px 20px', flex: 1, marginBottom: 20,
    boxShadow: 'var(--shadow-md)',
  },
  stepContent: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  stepEmoji: { fontSize: 48, marginBottom: 12 },
  stepTitle: { fontSize: 22, fontWeight: 800, color: 'var(--color-slate)', margin: '0 0 6px', textAlign: 'center' },
  stepSub: { fontSize: 14, color: 'var(--color-text-muted)', margin: '0 0 24px', textAlign: 'center' },
  input: {
    width: '100%', padding: '14px 16px', borderRadius: 12,
    border: '2px solid var(--color-border)', fontSize: 18, fontWeight: 700,
    color: 'var(--color-slate)', background: 'var(--color-bg)',
    textAlign: 'center', outline: 'none',
    boxSizing: 'border-box',
  },
  coppaNote: {
    marginTop: 12, fontSize: 13, color: 'var(--color-saffron)',
    background: 'var(--color-saffron-subtle)', borderRadius: 10,
    padding: '10px 14px', textAlign: 'center',
  },
  optionGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' },
  optionBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: '16px 8px', borderRadius: 16,
    border: '2px solid var(--color-border)', background: 'var(--color-bg)',
    cursor: 'pointer', transition: 'all 0.15s',
  },
  optionBtnActive: { border: '2px solid var(--color-teal)', background: 'var(--color-teal-subtle)' },
  optionLabel: { fontSize: 13, fontWeight: 600, color: 'var(--color-text)' },
  langGrid: { display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', width: '100%' },
  langBtn: {
    padding: '10px 18px', borderRadius: 20,
    border: '2px solid var(--color-border)', background: 'var(--color-bg)',
    fontSize: 14, fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer',
  },
  langBtnActive: { border: '2px solid var(--color-teal)', background: 'var(--color-teal-subtle)', color: 'var(--color-teal)' },
  motivList: { display: 'flex', flexDirection: 'column', gap: 10, width: '100%' },
  motivBtn: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
    borderRadius: 14, border: '2px solid var(--color-border)',
    background: 'var(--color-bg)', cursor: 'pointer', textAlign: 'left',
  },
  motivBtnActive: { border: '2px solid var(--color-teal)', background: 'var(--color-teal-subtle)' },
  motivLabel: { flex: 1, fontSize: 15, fontWeight: 600, color: 'var(--color-text)' },
  avatarGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, width: '100%', marginBottom: 16 },
  avatarBtn: {
    fontSize: 36, padding: '12px', borderRadius: 16,
    border: '2px solid var(--color-border)', background: 'var(--color-bg)',
    cursor: 'pointer', transition: 'all 0.15s', lineHeight: 1,
  },
  avatarBtnActive: { border: '2px solid var(--color-teal)', background: 'var(--color-teal-subtle)', transform: 'scale(1.1)' },
  avatarPreview: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    padding: '12px', background: 'var(--color-teal-subtle)', borderRadius: 16,
  },
  avatarPreviewEmoji: { fontSize: 48 },
  avatarPreviewLabel: { fontSize: 13, fontWeight: 600, color: 'var(--color-teal)' },
  navRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  backBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 15, fontWeight: 600, color: 'var(--color-text-muted)', padding: '12px 0',
  },
  nextBtn: {
    flex: 1, padding: '14px', borderRadius: 14,
    background: 'var(--color-teal)', color: '#fff',
    border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer',
  },
  nextBtnDisabled: { background: 'var(--color-border)', color: 'var(--color-text-muted)', cursor: 'not-allowed' },
};
