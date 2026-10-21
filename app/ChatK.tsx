"use client";

import imageCompression from "browser-image-compression";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, Check, CheckCheck, ChevronDown, CircleDot, Clock3, Ellipsis,
  ImagePlus, LockKeyhole, MessageCircle, Mic, Moon, MoreHorizontal, Paperclip,
  Phone, Plus, Reply, Search, Send, ShieldCheck, Smile, Sun, UsersRound, Video, X,
} from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";

type Message = {
  id: string;
  sender: "me" | "them";
  text: string;
  time: string;
  status?: "sent" | "delivered" | "read";
  replyText?: string;
  attachment?: { name: string; type: string; url: string; size: number };
};

type Chat = {
  id: string;
  name: string;
  handle: string;
  photo: string;
  color: string;
  online: boolean;
  group?: boolean;
  unread?: number;
  pending?: boolean;
  preview: string;
  time: string;
  messages: Message[];
};

type Story = { id: string; name: string; photo: string; color: string; caption: string; expiresAt?: number; hiddenFrom?: string[]; mediaUrl?: string; mediaType?: string };
type Tab = "chats" | "contacts" | "stories";
type Theme = "light" | "dark";

function readTheme(): Theme {
  const saved = window.localStorage.getItem("chatk-theme");
  return saved === "dark" || saved === "light" ? saved : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribeToTheme(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener("storage", callback);
  window.addEventListener("chatk-theme-change", callback);
  media.addEventListener("change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("chatk-theme-change", callback);
    media.removeEventListener("change", callback);
  };
}

function writeTheme(theme: Theme) {
  window.localStorage.setItem("chatk-theme", theme);
  window.dispatchEvent(new Event("chatk-theme-change"));
}

const image = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=160&h=160&q=80`;
const initialStories: Story[] = [
  { id: "naya", name: "Naya", photo: image("photo-1534528741775-53994a69daeb"), color: "#e8c2b1", caption: "akhirnya ketemu tempat yang pas 🌿" },
  { id: "arka", name: "Arka", photo: image("photo-1500648767791-00dcc994a43e"), color: "#bcab98", caption: "Jumat sore, pelan-pelan saja." },
  { id: "studio", name: "Studio Kecil", photo: image("photo-1521737711867-e3b97375f902"), color: "#c3d0bd", caption: "work in progress ✳" },
];
const initialChats: Chat[] = [
  {
    id: "naya", name: "Naya Pratama", handle: "@nayap", photo: image("photo-1534528741775-53994a69daeb"), color: "#e8c2b1", online: true,
    preview: "Kirim foto tempatnya dong!", time: "09.41",
    messages: [
      { id: "n1", sender: "them", text: "Pagi, Raka! ☀️", time: "09.32" },
      { id: "n2", sender: "me", text: "Pagi Nay, jadi ke pameran sore ini?", time: "09.34", status: "read" },
      { id: "n3", sender: "them", text: "Jadi dong! Aku sudah simpan tiketnya. Katanya ada instalasi baru di lantai dua.", time: "09.36" },
      { id: "n4", sender: "me", text: "Wah, yang ruang cermin itu? Kayaknya seru banget.", time: "09.38", status: "read" },
      { id: "n5", sender: "them", text: "Iya! Kirim foto tempatnya dong!", time: "09.41" },
    ],
  },
  {
    id: "arka", name: "Arka Wibowo", handle: "@arkaw", photo: image("photo-1500648767791-00dcc994a43e"), color: "#bcab98", online: false,
    unread: 2, preview: "Nanti aku kabari ya.", time: "08.56",
    messages: [
      { id: "a1", sender: "them", text: "File desainnya sudah aku kirim ke email.", time: "08.51" },
      { id: "a2", sender: "me", text: "Sip, makasih! Aku cek siang ini.", time: "08.53", status: "read" },
      { id: "a3", sender: "them", text: "Nanti aku kabari ya.", time: "08.56" },
    ],
  },
  {
    id: "studio", name: "Studio Kecil", handle: "3 anggota", photo: image("photo-1521737711867-e3b97375f902"), color: "#c3d0bd", online: true,
    group: true, preview: "Dimas: moodboard-nya cakep", time: "Kemarin",
    messages: [
      { id: "s1", sender: "them", text: "Dimas: moodboard-nya cakep", time: "16.20" },
      { id: "s2", sender: "me", text: "Warna hijau ini kita pertahankan ya?", time: "16.24", status: "read" },
    ],
  },
  {
    id: "ibu", name: "Ibu", handle: "@ibu", photo: image("photo-1544005313-94ddf0286df2"), color: "#d9c6aa", online: true,
    preview: "Jangan lupa makan siang ya", time: "Kemarin",
    messages: [
      { id: "i1", sender: "them", text: "Jangan lupa makan siang ya", time: "12.04" },
      { id: "i2", sender: "me", text: "Siap, Bu. Nanti aku kabari ❤️", time: "12.10", status: "read" },
    ],
  },
  {
    id: "seno", name: "Seno Aditya", handle: "@senoa", photo: image("photo-1506794778202-cad84cf45f1d"), color: "#b9c6cf", online: false,
    preview: "Voice note · 0:18", time: "Selasa",
    messages: [
      { id: "se1", sender: "them", text: "Ada kabar dari tim?", time: "14.18" },
      { id: "se2", sender: "me", text: "Belum, besok aku follow up ya.", time: "14.23", status: "read" },
    ],
  },
];

function Avatar({ name, src, color, size = "medium", online = false, story = false }: {
  name: string; src: string; color: string; size?: "small" | "medium" | "large"; online?: boolean; story?: boolean;
}) {
  return <span className={`avatar avatar-${size} ${story ? "avatar-story" : ""}`}>
    <span className="avatar-photo" role="img" aria-label={name} style={{ backgroundColor: color, backgroundImage: src ? `url("${src}")` : undefined }}>{name.slice(0, 1)}</span>
    {online && <span className="online-dot" />}
  </span>;
}

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function ChatK() {
  const [chats, setChats] = useState(initialChats);
  const [stories, setStories] = useState(initialStories);
  const [activeId, setActiveId] = useState("naya");
  const [tab, setTab] = useState<Tab>("chats");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const theme = useSyncExternalStore(subscribeToTheme, readTheme, () => "light");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [contactInput, setContactInput] = useState("");
  const [storyDraft, setStoryDraft] = useState("");
  const [storyMedia, setStoryMedia] = useState<{ name: string; type: string; url: string; size: number } | null>(null);
  const [hiddenContactIds, setHiddenContactIds] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [attachment, setAttachment] = useState<Message["attachment"]>();
  const [recording, setRecording] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const touchStartX = useRef(0);
  const chat = chats.find((item) => item.id === activeId) ?? chats[0];
  const filteredChats = chats.filter((item) => `${item.name} ${item.handle}`.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const timer = window.setInterval(() => setStories((current) => current.filter((story) => !story.expiresAt || story.expiresAt > Date.now())), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  function selectChat(id: string) {
    setActiveId(id);
    setMobileChatOpen(true);
    setReplyTo(null);
    setChats((current) => current.map((item) => item.id === id ? { ...item, unread: 0 } : item));
  }

  function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const text = draft.trim();
    if ((!text && !attachment) || chat.pending) return;
    const message: Message = {
      id: crypto.randomUUID(), sender: "me", text,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      status: "sent", replyText: replyTo?.text, attachment,
    };
    setChats((current) => current.map((item) => item.id === activeId
      ? { ...item, messages: [...item.messages, message], preview: attachment ? `Lampiran · ${attachment.name}` : text, time: message.time }
      : item));
    setDraft(""); setReplyTo(null); setAttachment(undefined);
    window.setTimeout(() => setChats((current) => current.map((item) => item.id === activeId
      ? { ...item, messages: item.messages.map((entry) => entry.id === message.id ? { ...entry, status: "read" } : entry) }
      : item)), 1100);
  }

  async function handleFile(file?: File) {
    if (!file) return;
    let chosen = file;
    if (file.size > 25 * 1024 * 1024 && file.type.startsWith("image/")) {
      setToast("Mengompres gambar di perangkat…");
      try { chosen = await imageCompression(file, { maxSizeMB: 24, maxWidthOrHeight: 1920, useWebWorker: true }); }
      catch { setToast("Gambar gagal dikompres. Coba file yang lebih kecil."); return; }
    }
    if (chosen.size > 25 * 1024 * 1024) { setToast("File melebihi batas 25 MB."); return; }
    setAttachment({ name: chosen.name, type: chosen.type, url: URL.createObjectURL(chosen), size: chosen.size });
    setToast(`${chosen.name} siap dikirim · ${formatSize(chosen.size)}`);
  }

  async function toggleVoiceNote() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setToast("Browser ini belum mendukung perekaman audio.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        recorderRef.current = null;
        setRecording(false);
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        if (blob.size > 25 * 1024 * 1024) {
          setToast("Voice note melebihi batas 25 MB.");
          return;
        }
        const url = URL.createObjectURL(blob);
        setAttachment({ name: "voice-note.webm", type: blob.type, url, size: blob.size });
        setToast("Voice note siap dikirim.");
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setToast("Akses mikrofon ditolak atau tidak tersedia.");
    }
  }

  function addContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const handle = contactInput.trim().replace(/^@/, "");
    if (!handle) return;
    if (chats.some((item) => item.handle.toLowerCase() === `@${handle}`.toLowerCase())) { setToast("Kontak ini sudah ada di daftar kamu."); return; }
    const contact: Chat = {
      id: `contact-${crypto.randomUUID()}`,
      name: handle.replace(/[._-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
      handle: `@${handle}`, photo: "", color: "#a7cbb9", online: false, pending: true,
      preview: "Permintaan terkirim", time: "Baru", messages: [],
    };
    setChats((current) => [contact, ...current]);
    setContactInput(""); setShowContactModal(false); setTab("chats"); selectChat(contact.id);
    setToast("Permintaan kontak terkirim. Obrolan tersedia setelah diterima.");
  }

  function publishStory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!storyDraft.trim() && !storyMedia) return;
    const newStory: Story = {
      id: crypto.randomUUID(), name: "Kamu", photo: image("photo-1506794778202-cad84cf45f1d"), color: "#a7cbb9",
      caption: storyDraft.trim() || storyMedia?.name || "Media", expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      hiddenFrom: hiddenContactIds, mediaUrl: storyMedia?.url, mediaType: storyMedia?.type,
    };
    setStories((current) => [newStory, ...current]);
    setShowStoryModal(false); setStoryDraft(""); setStoryMedia(null); setHiddenContactIds([]); setTab("stories");
    setToast("Status dibagikan ke kontak terhubung. Status akan hilang dalam 24 jam.");
  }

  function reply(message: Message) {
    setReplyTo(message);
    document.querySelector<HTMLTextAreaElement>(".message-input")?.focus();
  }

  return <main className="canvas">
    <div className="app-window">
      <aside className="icon-rail" aria-label="Navigasi utama">
        <a className="brand-mark" href="#chat" aria-label="ChatK beranda"><span>k</span><i /></a><div className="rail-divider" />
        <button className={`rail-button ${tab === "chats" ? "rail-active" : ""}`} onClick={() => { setTab("chats"); setMobileChatOpen(false); }} aria-label="Obrolan" title="Obrolan"><MessageCircle size={19} /><span className="rail-indicator" /></button>
        <button className={`rail-button ${tab === "contacts" ? "rail-active" : ""}`} onClick={() => { setTab("contacts"); setMobileChatOpen(false); }} aria-label="Kontak" title="Kontak"><UsersRound size={19} /></button>
        <button className={`rail-button ${tab === "stories" ? "rail-active" : ""}`} onClick={() => { setTab("stories"); setMobileChatOpen(false); }} aria-label="Status" title="Status"><CircleDot size={19} /></button>
        <div className="rail-spacer" />
        <button className="rail-button" onClick={() => writeTheme(theme === "dark" ? "light" : "dark")} aria-label="Ganti tema" title="Ganti tema">{theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}</button>
        <button className="rail-profile" aria-label="Profil Raka"><Avatar name="Raka" src={image("photo-1506794778202-cad84cf45f1d")} color="#a7cbb9" size="small" /></button>
      </aside>

      <aside className={`sidebar ${mobileChatOpen ? "sidebar-mobile-hidden" : ""}`}>
        <header className="sidebar-header"><div><span className="eyebrow">RUANG PRIBADI</span><h1>{tab === "chats" ? "Obrolan" : tab === "contacts" ? "Kontak" : "Status"}</h1></div>
          <button className="icon-button add-button" onClick={() => tab === "stories" ? setShowStoryModal(true) : setShowContactModal(true)} aria-label={tab === "stories" ? "Buat status" : "Tambah kontak"} title={tab === "stories" ? "Buat status" : "Tambah kontak"}><Plus size={18} /></button>
        </header>
        <label className="search-wrap"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={tab === "contacts" ? "Cari kontak" : "Cari obrolan"} aria-label="Cari" /><kbd>⌘ K</kbd></label>

        {tab === "chats" && <>
          <section className="story-strip" aria-label="Status terbaru">
            <button className="story-item" onClick={() => setShowStoryModal(true)}><span className="story-add-avatar"><Avatar name="Raka" src={image("photo-1506794778202-cad84cf45f1d")} color="#a7cbb9" /><i><Plus size={12} /></i></span><span>Statusku</span></button>
            {stories.slice(0, 3).map((story) => <button className="story-item" key={story.id} onClick={() => setToast(story.caption)}><Avatar name={story.name} src={story.photo} color={story.color} story /><span>{story.name}</span></button>)}
          </section>
          <div className="list-heading"><span>TERKINI</span><button onClick={() => setToast("Semua percakapan aktif ditampilkan.")} aria-label="Opsi daftar"><Ellipsis size={18} /></button></div>
          <div className="conversation-list">{filteredChats.map((item) => <button className={`conversation-item ${activeId === item.id ? "conversation-active" : ""}`} key={item.id} onClick={() => selectChat(item.id)}>
            <Avatar name={item.name} src={item.photo} color={item.color} online={item.online} size="large" />
            <span className="conversation-copy"><span className="conversation-title"><strong>{item.name}</strong><time>{item.time}</time></span><span className="conversation-preview">{item.group && <UsersRound size={12} />}{item.preview}</span></span>
            {item.unread ? <span className="unread-count">{item.unread}</span> : null}
          </button>)}{filteredChats.length === 0 && <p className="empty-note">Belum ada obrolan yang cocok.</p>}</div>
        </>}

        {tab === "contacts" && <div className="contact-list"><div className="list-heading"><span>TERHUBUNG · {filteredChats.filter((item) => !item.pending).length}</span></div>
          {filteredChats.map((item) => <button className="contact-item" key={item.id} onClick={() => { setTab("chats"); selectChat(item.id); }}><Avatar name={item.name} src={item.photo} color={item.color} online={item.online} /><span><strong>{item.name}</strong><small>{item.pending ? "Permintaan terkirim" : item.handle}</small></span><ChevronDown className="contact-chevron" size={16} /></button>)}
          <button className="invite-card" onClick={() => setShowContactModal(true)}><span className="invite-icon"><Plus size={17} /></span><span><strong>Tambah kontak baru</strong><small>Hubungkan dengan nama pengguna</small></span></button>
        </div>}

        {tab === "stories" && <div className="stories-list"><button className="my-story-card" onClick={() => setShowStoryModal(true)}><span className="story-create-icon"><Plus size={19} /></span><span><strong>Bagikan momen</strong><small>Terlihat oleh kontak terhubung</small></span></button>
          <div className="list-heading"><span>PEMBARUAN TERBARU</span></div>
          {stories.map((story, index) => <button className="status-list-item" key={story.id} onClick={() => setToast(story.caption)}><Avatar name={story.name} src={story.photo} color={story.color} story /><span><strong>{story.name}</strong><small>{story.expiresAt ? "Baru saja · 24 jam" : index === 0 ? "12 menit lalu" : "1 jam lalu"}</small></span><span className="status-preview">{story.caption}</span></button>)}
        </div>}
        <footer className="sidebar-footer"><span className="demo-dot" /><span>Demo lokal</span><button onClick={() => setToast("Supabase belum dikonfigurasi. Data belum disinkronkan.")} aria-label="Info koneksi"><ShieldCheck size={15} /></button></footer>
      </aside>

      <section className={`chat-panel ${mobileChatOpen ? "chat-mobile-open" : ""}`} id="chat">
        <header className="chat-header"><button className="icon-button mobile-back" onClick={() => setMobileChatOpen(false)} aria-label="Kembali"><ArrowLeft size={19} /></button>
          <Avatar name={chat.name} src={chat.photo} color={chat.color} online={chat.online} />
          <div className="chat-heading"><strong>{chat.name}</strong><span>{chat.pending ? "Menunggu konfirmasi kontak" : chat.group ? "Grup · 3 anggota" : chat.online ? <><i className="status-pulse" /> Sedang online</> : "Terakhir dilihat baru-baru ini"}</span></div>
          <div className="chat-header-actions"><button className="icon-button" aria-label="Panggilan suara" title="Panggilan suara" onClick={() => setToast("Panggilan suara tersedia setelah Supabase dikonfigurasi.")}><Phone size={18} /></button><button className="icon-button" aria-label="Panggilan video" title="Panggilan video" onClick={() => setToast("Panggilan video tersedia setelah Supabase dikonfigurasi.")}><Video size={19} /></button><span className="header-action-divider" /><button className={`icon-button ${showDetails ? "header-selected" : ""}`} aria-label="Info obrolan" title="Info obrolan" onClick={() => setShowDetails(!showDetails)}><MoreHorizontal size={19} /></button></div>
        </header>
        <div className="chat-scroll" key={chat.id}><div className="date-divider"><span /><time>HARI INI</time><span /></div>
          <div className="encryption-note"><span><LockKeyhole size={13} /></span><p>Demo lokal. E2EE aktif setelah backend dikonfigurasi.</p><button onClick={() => setToast("Pesan hanya tersimpan di memori sesi ini.")} aria-label="Tentang privasi"><CircleDot size={12} /></button></div>
          <AnimatePresence initial={false}>{chat.messages.map((message, index) => {
            const grouped = chat.messages[index - 1]?.sender === message.sender;
            return <motion.div className={`message-row ${message.sender === "me" ? "message-mine" : "message-theirs"} ${grouped ? "message-grouped" : ""}`} key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .22 }} onTouchStart={(event) => { touchStartX.current = event.touches[0].clientX; }} onTouchEnd={(event) => { if (event.changedTouches[0].clientX - touchStartX.current > 56) reply(message); }} onContextMenu={(event) => { event.preventDefault(); reply(message); }}>
              {message.sender === "them" && !grouped && <Avatar name={chat.name} src={chat.photo} color={chat.color} size="small" />}{message.sender === "them" && grouped && <span className="message-avatar-space" />}
              <div className="message-content"><button className="reply-action" onClick={() => reply(message)} aria-label="Balas pesan"><Reply size={15} /></button>
                {message.replyText && <div className="reply-quote"><span />{message.replyText}</div>}
                {message.attachment && <div className="message-attachment">{message.attachment.type.startsWith("image/") ? <div className="attachment-image" role="img" aria-label={message.attachment.name} style={{ backgroundImage: `url("${message.attachment.url}")` }} /> : message.attachment.type.startsWith("video/") ? <video controls src={message.attachment.url} /> : message.attachment.type.startsWith("audio/") ? <audio controls src={message.attachment.url} /> : <div className="attachment-file"><ImagePlus size={18} /><span>{message.attachment.name}<small>{formatSize(message.attachment.size)}</small></span></div>}</div>}
                {message.text && <p>{message.text}</p>}<span className="message-meta"><time>{message.time}</time>{message.sender === "me" && (message.status === "read" ? <CheckCheck size={14} /> : <Check size={14} />)}</span>
              </div>
            </motion.div>;
          })}</AnimatePresence>
        </div>

        <div className="composer-area">{chat.pending ? <div className="pending-note"><Clock3 size={15} />Kamu bisa mulai mengobrol setelah permintaan kontak diterima.</div> : <>
          <AnimatePresence>{replyTo && <motion.div className="replying-to" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}><span className="reply-line" /><span><small>Membalas {replyTo.sender === "me" ? "pesanmu" : chat.name.split(" ")[0]}</small><strong>{replyTo.text || replyTo.attachment?.name || "Lampiran"}</strong></span><button onClick={() => setReplyTo(null)} aria-label="Batal membalas"><X size={16} /></button></motion.div>}
            {attachment && <motion.div className="attachment-pending" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><span className="attachment-pending-icon"><ImagePlus size={16} /></span><span><strong>{attachment.name}</strong><small>{formatSize(attachment.size)} · Siap dikirim</small></span><button onClick={() => { URL.revokeObjectURL(attachment.url); setAttachment(undefined); }} aria-label="Hapus lampiran"><X size={15} /></button></motion.div>}</AnimatePresence>
          <form className="composer" onSubmit={sendMessage}><button type="button" className="composer-icon" onClick={() => fileInput.current?.click()} aria-label="Lampirkan foto atau file" title="Lampirkan foto atau file"><Paperclip size={19} /></button>
            <input ref={fileInput} type="file" hidden accept="image/*,video/*,audio/*" onChange={(event) => { void handleFile(event.target.files?.[0]); event.target.value = ""; }} />
            <textarea className="message-input" rows={1} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder="Tulis pesan…" aria-label="Tulis pesan" />
            <span className="composer-divider" /><button type="button" className="composer-icon" onClick={() => setDraft((current) => `${current}${current ? " " : ""}😊`)} aria-label="Tambahkan emoji"><Smile size={19} /></button>
            {draft.trim() || attachment ? <button type="submit" className="send-button" aria-label="Kirim pesan"><Send size={17} /></button> : <button type="button" className={`composer-icon ${recording ? "recording-active" : ""}`} onClick={() => void toggleVoiceNote()} aria-label={recording ? "Selesaikan voice note" : "Rekam voice note"} title={recording ? "Selesaikan rekaman" : "Rekam voice note"}><Mic size={19} /></button>}
          </form><div className={`composer-caption ${recording ? "recording-caption" : ""}`}><LockKeyhole size={11} /><span>{recording ? "Merekam voice note · ketuk mikrofon untuk selesai" : "Data sesi hanya di perangkat"}</span><span className="caption-limit">Maks. 25 MB</span></div>
        </>}</div>
      </section>

      {showDetails && <aside className="details-panel"><div className="details-topline"><span>DETAIL OBROLAN</span><button className="icon-button details-close" onClick={() => setShowDetails(false)} aria-label="Tutup detail"><X size={17} /></button></div>
        <div className="profile-detail"><Avatar name={chat.name} src={chat.photo} color={chat.color} online={chat.online} size="large" /><h2>{chat.name}</h2><span>{chat.handle}</span><div className="profile-actions"><button onClick={() => setToast("Panggilan suara tersedia setelah backend dikonfigurasi.")}><Phone size={16} /><small>Telepon</small></button><button onClick={() => setToast("Pencarian pesan tersedia di versi sinkron.")}><Search size={16} /><small>Cari</small></button><button onClick={() => setToast("Pengaturan kontak dibuka.")}><Ellipsis size={17} /><small>Lainnya</small></button></div></div>
        <div className="details-section"><div className="details-label"><span>TENTANG</span><ChevronDown size={15} /></div><p>{chat.group ? "Tempat berbagi ide, tautan, dan proses kreatif." : "Terhubung di ChatK"}</p><div className="detail-meta"><Clock3 size={14} /><span>{chat.online ? "Aktif sekarang" : "Aktif baru-baru ini"}</span></div></div>
        <div className="details-section media-section"><div className="details-label"><span>MEDIA BERSAMA</span><button onClick={() => setToast("Belum ada media bersama di sesi ini.")}>Lihat semua <ChevronDown size={13} /></button></div><div className="media-grid"><button className="media-placeholder media-green" onClick={() => setToast("Media bersama akan muncul di sini.")}><ImagePlus size={18} /></button><button className="media-placeholder media-pink" onClick={() => setToast("Media bersama akan muncul di sini.")}><Smile size={18} /></button><button className="media-placeholder media-blue" onClick={() => setToast("Media bersama akan muncul di sini.")}><Video size={18} /></button></div></div>
        <div className="privacy-card"><span className="privacy-icon"><ShieldCheck size={16} /></span><div><strong>Demo lokal</strong><p>Supabase belum tersambung. Pesan tidak disinkronkan ke pengguna lain.</p></div></div>
        <button className="privacy-link" onClick={() => setToast("E2EE memerlukan integrasi Supabase dan pertukaran kunci Web Crypto.")}><LockKeyhole size={14} />Tentang privasi dan keamanan</button>
      </aside>}
    </div>

    <AnimatePresence>{showContactModal && <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setShowContactModal(false); }}><motion.div className="modal-card" initial={{ opacity: 0, y: 16, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .98 }}><div className="modal-heading"><span className="modal-icon"><UsersRound size={19} /></span><button className="icon-button" onClick={() => setShowContactModal(false)} aria-label="Tutup"><X size={18} /></button></div><h2>Temukan temanmu</h2><p>Masukkan nama pengguna untuk mengirim permintaan kontak.</p><form onSubmit={addContact}><label htmlFor="contact-handle">Nama pengguna</label><div className="handle-input"><span>@</span><input id="contact-handle" autoFocus value={contactInput} onChange={(event) => setContactInput(event.target.value.replace(/^@/, ""))} placeholder="nama.pengguna" /></div><div className="modal-footnote"><LockKeyhole size={13} />Obrolan dimulai setelah permintaan diterima.</div><button className="primary-button" type="submit">Kirim permintaan <Send size={15} /></button></form></motion.div></motion.div>}
      {showStoryModal && <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setShowStoryModal(false); }}><motion.div className="modal-card story-modal" initial={{ opacity: 0, y: 16, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .98 }}><div className="modal-heading"><span className="modal-icon"><CircleDot size={19} /></span><button className="icon-button" onClick={() => setShowStoryModal(false)} aria-label="Tutup"><X size={18} /></button></div><h2>Bagikan momen</h2><p>Status akan hilang otomatis setelah 24 jam.</p><form onSubmit={publishStory}><label htmlFor="story-text">Apa yang ingin kamu bagikan?</label><textarea id="story-text" autoFocus value={storyDraft} onChange={(event) => setStoryDraft(event.target.value)} placeholder="Tulis sesuatu yang ingin diingat…" rows={3} /><label className="story-file-button"><ImagePlus size={15} />{storyMedia ? storyMedia.name : "Tambahkan foto atau video"}<input type="file" accept="image/*,video/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) { if (file.size > 25 * 1024 * 1024) setToast("Media status maksimal 25 MB."); else setStoryMedia({ name: file.name, type: file.type, url: URL.createObjectURL(file), size: file.size }); } event.target.value = ""; }} /></label><fieldset className="privacy-options"><legend>Sembunyikan status dari</legend>{chats.filter((item) => !item.pending).map((item) => <label key={item.id}><input type="checkbox" checked={hiddenContactIds.includes(item.id)} onChange={(event) => setHiddenContactIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} /><span>{item.name}</span></label>)}</fieldset><button className="primary-button" type="submit">Bagikan status <Send size={15} /></button></form></motion.div></motion.div>}</AnimatePresence>
    <AnimatePresence>{toast && <motion.div className="toast" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}><ShieldCheck size={16} /><span>{toast}</span><button onClick={() => setToast("")} aria-label="Tutup notifikasi"><X size={14} /></button></motion.div>}</AnimatePresence>
    <nav className="mobile-nav" aria-label="Navigasi"><button className={tab === "chats" ? "mobile-nav-active" : ""} onClick={() => { setTab("chats"); setMobileChatOpen(false); }}><MessageCircle size={19} /><span>Obrolan</span></button><button className={tab === "contacts" ? "mobile-nav-active" : ""} onClick={() => { setTab("contacts"); setMobileChatOpen(false); }}><UsersRound size={19} /><span>Kontak</span></button><button className={tab === "stories" ? "mobile-nav-active" : ""} onClick={() => { setTab("stories"); setMobileChatOpen(false); }}><CircleDot size={19} /><span>Status</span></button><button onClick={() => writeTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}<span>Tema</span></button></nav>
  </main>;
}