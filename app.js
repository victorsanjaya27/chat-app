// === Firebase Config ===
const firebaseConfig = {
  apiKey: "AIzaSyA6r1iKEFCqtc9hbdrdfDxjmcfCR2NTXk0",
  authDomain: "chat-belajar-339ee.firebaseapp.com",
  databaseURL:
    "https://chat-belajar-339ee-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chat-belajar-339ee",
  storageBucket: "chat-belajar-339ee.appspot.com",
  messagingSenderId: "91185788879",
  appId: "1:91185788879:web:5dcd33ecae7786b28ac4ba",
  measurementId: "G-G8VK762G91",
};

document.addEventListener("DOMContentLoaded", () => {
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  const IMGUR_CLIENT_ID = "bdc8990347c6c70";

  let touchStartX = 0;
  let touchEndX = 0;

  let imageUrls = [];
  let currentImageIndex = 0;

  // === DOM Elements ===
  const chatBox = document.getElementById("chatBox");
  const msgInput = document.getElementById("msgInput");
  const sendBtn = document.getElementById("sendBtn");
  const nameModal = document.getElementById("nameModal");
  const nameInput = document.getElementById("nameInput");
  const saveNameBtn = document.getElementById("saveNameBtn");
  const roomSelect = document.getElementById("roomSelect");
  const darkToggle = document.getElementById("darkModeToggle");
  const html = document.documentElement;

  // === Theme (Dark Mode) ===
  if (localStorage.getItem("theme") === "dark") {
    html.classList.add("dark");
    darkToggle.checked = true;
  }

  darkToggle.addEventListener("change", () => {
    if (darkToggle.checked) {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  });

  //  Username & Room
  let username = localStorage.getItem("username");
  let currentRoom = localStorage.getItem("currentRoom") || "umum";

  if (!username) {
    nameModal.classList.remove("hidden");
  } else {
    nameModal.classList.add("hidden");
    roomSelect.value = currentRoom;
    loadMessages();
  }

  saveNameBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (name) {
      username = name;
      localStorage.setItem("username", username);
      nameModal.classList.add("hidden");
      loadMessages();
    }
  });

  roomSelect.addEventListener("change", () => {
    currentRoom = roomSelect.value;
    localStorage.setItem("currentRoom", currentRoom);
    chatBox.innerHTML = "";
    loadMessages();
  });

  function getChatRef() {
    return db.ref(`chats/${currentRoom}`);
  }

  // === Kirim Pesan ===
  function sendMessage() {
    const msg = msgInput.value.trim();
    if (msg !== "") {
      if (msg.length > 500) {
        alert("Pesan terlalu panjang!");
        return;
      }

      const chat = {
        sender: username,
        message: msg,
        timestamp: Date.now(),
      };
      getChatRef().push(chat);
      msgInput.value = "";
      msgInput.focus();
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  const imageInput = document.getElementById("imageInput");
  const imageBtn = document.getElementById("imageBtn");

  imageBtn.addEventListener("click", () => {
    imageInput.click(); // buka dialog file
  });

  imageInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("https://api.imgur.com/3/image", {
        method: "POST",
        headers: {
          Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error("Upload gagal");

      // langsung ambil link-nya
      const imageUrl = data.data.link;

      const chat = {
        sender: username,
        message: imageUrl,
        isImage: true,
        timestamp: Date.now(),
      };
      getChatRef().push(chat);
    } catch (err) {
      alert("Gagal mengupload gambar ke Imgur!");
      console.error(err);
    }
  });

  msgInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // === Load Pesan ===
  let lastMessageDate = null;
  function loadMessages() {
    chatBox.innerHTML = "";
    getChatRef().once("value", (snapshot) => {
      if (!snapshot.exists()) {
        const emptyMsg = document.createElement("p");
        emptyMsg.textContent = "Belum ada pesan di room ini.";
        emptyMsg.className = "text-center text-gray-400 mt-4";
        chatBox.appendChild(emptyMsg);
      }
    });

    getChatRef().off();

    // Pasang listener untuk perubahan pesan SEKALI SAJA
    getChatRef().on("child_changed", (snapshot) => {
      const updatedChat = snapshot.val();
      const msgId = snapshot.key;

      const editBtn = document.querySelector(`.editBtn[data-id="${msgId}"]`);
      if (editBtn) {
        const bubble = editBtn.closest(
          ".bg-green-100, .bg-gray-200, .dark\\:bg-green-700, .dark\\:bg-gray-700"
        );
        if (bubble) {
          const messageText = bubble.querySelector("div.text-base");
          if (messageText) {
            messageText.innerHTML = updatedChat.isImage
              ? `<img src="${updatedChat.message}" ... />`
              : `${updatedChat.message} ${
                  updatedChat.edited
                    ? '<span class="text-xs italic text-gray-500">(diedit)</span>'
                    : ""
                }`;
          }
        }
      }
    });

    getChatRef().on("child_added", (snapshot) => {
      const chat = snapshot.val();
      if (!chat || !chat.sender || !chat.message) return;

      const time = new Date(chat.timestamp);
      const formattedTime = time.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });

      getChatRef().on("child_changed", (snapshot) => {
        const updatedChat = snapshot.val();
        const msgId = snapshot.key;

        const editBtn = document.querySelector(`.editBtn[data-id="${msgId}"]`);
        if (editBtn) {
          const bubble = editBtn.closest(
            ".bg-green-100, .bg-gray-200, .dark\\:bg-green-700, .dark\\:bg-gray-700"
          );
          if (bubble) {
            const messageText = bubble.querySelector("div.text-base");
            if (messageText) {
              messageText.innerHTML = updatedChat.isImage
                ? `<img src="${updatedChat.message}" ... />`
                : `${updatedChat.message} ${
                    updatedChat.edited
                      ? '<span class="text-xs italic text-gray-500">(diedit)</span>'
                      : ""
                  }`;
            }
          }
        }
      });

      const dateStr = time.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const isMine = chat.sender === username;

      if (lastMessageDate !== dateStr) {
        const dateSeparator = document.createElement("div");
        dateSeparator.textContent = `── ${dateStr} ──`;
        dateSeparator.className =
          "text-center text-sm text-gray-500 my-2 italic dark:text-gray-400";
        chatBox.appendChild(dateSeparator);
        lastMessageDate = dateStr;
      }

      const messageDiv = document.createElement("div");
      messageDiv.className = "flex items-start gap-2 mb-2";
      messageDiv.classList.add(isMine ? "justify-end" : "justify-start");

      const avatar = document.createElement("div");
      avatar.className = `w-8 h-8 rounded-full flex items-center justify-center font-bold text-white 
        ${isMine ? "bg-green-500" : "bg-gray-500"}`;
      avatar.textContent = chat.sender[0].toUpperCase();

      const bubble = document.createElement("div");
      bubble.className = `max-w-xs p-2 rounded-lg shadow my-1 w-fit ${
        isMine
          ? "bg-green-100 text-right dark:bg-green-700 dark:text-white"
          : "bg-gray-200 text-left dark:bg-gray-700 dark:text-white"
      }`;

      bubble.innerHTML = `
        <div class="text-sm font-bold flex justify-between items-center">
          <span>${
            chat.sender
          } <span class="text-xs text-gray-500">[${formattedTime}]</span></span>
          ${
            isMine && !chat.isImage
              ? `
    <button class="editBtn text-blue-500 text-xs ml-2" data-id="${snapshot.key}">✏️</button>
    <button class="deleteBtn text-red-500 text-xs ml-2" data-id="${snapshot.key}">🗑️</button>
    `
              : ""
          }


        </div>
        <div class="text-base">
          ${
            chat.isImage
              ? `<img src="${chat.message}" ... />`
              : `${chat.message} ${
                  chat.edited
                    ? '<span class="text-xs italic text-gray-500">(diedit)</span>'
                    : ""
                }`
          }

        </div>
      `;

      if (isMine) {
        messageDiv.appendChild(bubble);
        messageDiv.appendChild(avatar);
      } else {
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
      }

      chatBox.appendChild(messageDiv);

      // Event klik gambar
      if (chat.isImage) {
        const img = messageDiv.querySelector("img");
        img.style.cursor = "pointer";

        imageUrls.push(chat.message);
        img.addEventListener("click", () => {
          const modal = document.getElementById("imageModal");
          const modalImg = document.getElementById("modalImage");
          currentImageIndex = imageUrls.indexOf(chat.message);
          modalImg.src = chat.message;

          modal.classList.remove("hidden", "opacity-0");
          modal.classList.add("opacity-100");
        });
      }

      chatBox.scrollTop = chatBox.scrollHeight;

      const deleteBtn = messageDiv.querySelector(".deleteBtn");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
          const msgId = deleteBtn.getAttribute("data-id");
          getChatRef().child(msgId).remove();
        });
      }

      const editBtn = messageDiv.querySelector(".editBtn");
      if (editBtn) {
        editBtn.addEventListener("click", () => {
          const newMsg = prompt("Edit pesan:", chat.message);
          if (newMsg !== null && newMsg.trim() !== "") {
            getChatRef().child(snapshot.key).update({
              message: newMsg,
              edited: true,
            });
          }
        });
      }

      showNotification(chat);
    });

    getChatRef().on("child_removed", (snapshot) => {
      const msgId = snapshot.key;
      const deletedMsg = document.querySelector(
        `.deleteBtn[data-id="${msgId}"]`
      );
      if (deletedMsg) {
        const parent = deletedMsg.closest("div.flex.items-start");
        if (parent) parent.remove();
      }
    });
  }

  // Minta izin notifikasi saat awal load
  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  let isTabActive = true;

  document.addEventListener("visibilitychange", () => {
    isTabActive = !document.hidden;
  });

  function showNotification(chat) {
    if (!isTabActive && Notification.permission === "granted") {
      new Notification(`Pesan baru dari ${chat.sender}`, {
        body: chat.message,
        icon: "chat-icon.png", // ganti sesuai ikonmu
      });
    }
  }

  const imageModal = document.getElementById("imageModal");
  imageModal.classList.add("opacity-0"); // buat animasi keluar

  imageModal.addEventListener("click", (e) => {
    if (e.target === imageModal) {
      imageModal.classList.replace("opacity-100", "opacity-0");

      // Setelah animasi selesai, sembunyikan
      setTimeout(() => {
        imageModal.classList.add("hidden");
        document.getElementById("modalImage").src = "";
      }, 300); // waktu harus sama dengan duration animasi
    }
  });

  document.getElementById("prevImage").addEventListener("click", () => {
    if (currentImageIndex > 0) {
      currentImageIndex--;
      document.getElementById("modalImage").src = imageUrls[currentImageIndex];
    }
  });

  document.getElementById("nextImage").addEventListener("click", () => {
    if (currentImageIndex < imageUrls.length - 1) {
      currentImageIndex++;
      document.getElementById("modalImage").src = imageUrls[currentImageIndex];
    }
  });

  function handleSwipeGesture() {
    const swipeDistance = touchEndX - touchStartX;

    if (swipeDistance > 50) {
      // Geser ke kanan → gambar sebelumnya
      if (currentImageIndex > 0) {
        currentImageIndex--;
        document.getElementById("modalImage").src =
          imageUrls[currentImageIndex];
      }
    } else if (swipeDistance < -50) {
      // Geser ke kiri → gambar berikutnya
      if (currentImageIndex < imageUrls.length - 1) {
        currentImageIndex++;
        document.getElementById("modalImage").src =
          imageUrls[currentImageIndex];
      }
    }
  }
});
