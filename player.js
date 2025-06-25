const musicPlayer = {
    // Hằng số điều hướng bài hát
    NEXT_SONG: 1, // Chuyển sang bài kế tiếp
    PREV_SONG: -1, // Quay lại bài trước
    PREV_RESET_TIME: 2, // Thời gian tối thiểu (giây) để reset bài hiện tại thay vì chuyển bài trước

    // Hằng số localStorage keys
    STORAGE_KEYS: {
        LOOP_MODE: "musicPlayer_loopMode", // Key lưu trạng thái chế độ lặp lại
        SHUFFLE_MODE: "musicPlayer_shuffleMode", // Key lưu trạng thái chế độ phát ngẫu nhiên
    },

    // Các element DOM - lấy từ HTML
    playlistContainer: document.querySelector(".playlist"), // Container chứa danh sách bài hát
    playToggleBtn: document.querySelector(".btn-toggle-play"), // Nút play/pause chính
    currentSongTitle: document.querySelector(".current-song-title"), // Hiển thị tên bài đang phát
    audioPlayer: document.querySelector(".audio-player"), // Element audio HTML5
    playIcon: document.querySelector(".play-icon"), // Icon play/pause
    prevBtn: document.querySelector(".btn-prev"), // Nút bài trước
    nextBtn: document.querySelector(".btn-next"), // Nút bài kế tiếp
    loopBtn: document.querySelector(".btn-loop"), // Nút lặp lại
    shuffleBtn: document.querySelector(".btn-shuffle"), // Nút phát ngẫu nhiên
    progressBar: document.querySelector(".progress-bar"), // Thanh tiến trình

    // Danh sách bài hát
    songList: [
        {
            id: 1,
            filePath: "./songs/ChayNgayDi-SonTungMTP-5468704.mp3",
            title: "Chạy ngay đi",
            artist: "Sơn Tùng M-TP",
        },
        {
            id: 2,
            filePath: "./songs/GioThi-buitruonglinh-16952778.mp3",
            title: "Gió Thị",
            artist: "Bùi Trường Linh",
        },
        {
            id: 3,
            filePath: "./songs/HayTraoChoAnh-SonTungMTPSnoopDogg-6010660.mp3",
            title: "Hãy trao cho anh",
            artist: "Sơn Tùng M-TP ft. Snoop Dogg",
        },
        {
            id: 4,
            filePath: "./songs/MatKetNoi-DuongDomic-16783113.mp3",
            title: "Mất kết nối",
            artist: "Dương Domic",
        },
        {
            id: 5,
            filePath: "./songs/TaiSinh-TungDuong-16735175.mp3",
            title: "Tái sinh",
            artist: "Tùng Dương",
        },
    ],

    // Trạng thái của player
    currentSongIndex: 0, // Chỉ số bài hát hiện tại trong mảng
    isPlaying: false, // Trạng thái đang phát hay không
    isLoopMode: false, // Chế độ lặp lại (sẽ được load từ localStorage)
    isShuffleMode: false, // Chế độ phát ngẫu nhiên (sẽ được load từ localStorage)

    // Hàm khởi tạo - được gọi đầu tiên để thiết lập player
    initialize() {
        // Load trạng thái từ localStorage
        this.loadPlayerState();

        // Render danh sách bài hát lần đầu
        this.renderPlaylist();
        // Thiết lập bài hát đầu tiên
        this.setupCurrentSong();

        // Thiết lập các sự kiện DOM
        this.setupEventListeners();
    },

    // Load trạng thái player từ localStorage
    loadPlayerState() {
        this.isLoopMode =
            localStorage.getItem(this.STORAGE_KEYS.LOOP_MODE) === "true";
        this.isShuffleMode =
            localStorage.getItem(this.STORAGE_KEYS.SHUFFLE_MODE) === "true";
    },

    // Thiết lập tất cả các sự kiện click, change cho các element
    setupEventListeners() {
        // Sự kiện click nút play/pause chính
        this.playToggleBtn.onclick = this.togglePlayPause.bind(this);

        // Sự kiện khi audio bắt đầu phát
        this.audioPlayer.onplay = () => {
            this.isPlaying = true;
            // Đổi icon từ play sang pause
            this.playIcon.classList.remove("fa-play");
            this.playIcon.classList.add("fa-pause");
        };

        // Sự kiện khi audio bị dừng
        this.audioPlayer.onpause = () => {
            this.isPlaying = false;
            // Đổi icon từ pause sang play
            this.playIcon.classList.remove("fa-pause");
            this.playIcon.classList.add("fa-play");
        };

        // Sự kiện click nút bài trước
        this.prevBtn.onclick = this.handleSongNavigation.bind(
            this,
            this.PREV_SONG
        );
        // Sự kiện click nút bài kế tiếp
        this.nextBtn.onclick = this.handleSongNavigation.bind(
            this,
            this.NEXT_SONG
        );

        // Sự kiện toggle chế độ lặp lại
        this.loopBtn.onclick = () => {
            this.isLoopMode = !this.isLoopMode;
            this.updateLoopButtonState();
            // Lưu trạng thái vào localStorage để giữ khi reload trang
            localStorage.setItem(this.STORAGE_KEYS.LOOP_MODE, this.isLoopMode);
        };

        // Sự kiện toggle chế độ phát ngẫu nhiên
        this.shuffleBtn.onclick = () => {
            this.isShuffleMode = !this.isShuffleMode;
            this.updateShuffleButtonState();
            // Lưu trạng thái vào localStorage để giữ khi reload trang
            localStorage.setItem(
                this.STORAGE_KEYS.SHUFFLE_MODE,
                this.isShuffleMode
            );
        };

        // Sự kiện cập nhật thanh tiến trình khi audio đang phát
        this.audioPlayer.ontimeupdate = () => {
            // Không cập nhật nếu user đang kéo thanh tiến trình
            if (this.progressBar.seeking) return;

            // Tính phần trăm tiến trình
            const progressPercent =
                (this.audioPlayer.currentTime / this.audioPlayer.duration) *
                100;
            this.progressBar.value = progressPercent || 0;
        };

        // Sự kiện khi user bắt đầu kéo thanh tiến trình
        this.progressBar.onmousedown = () => {
            this.progressBar.seeking = true;
        };

        // Sự kiện khi user thả thanh tiến trình
        this.progressBar.onmouseup = () => {
            const targetPercent = +this.progressBar.value;
            const seekTime = (this.audioPlayer.duration / 100) * targetPercent;
            this.audioPlayer.currentTime = seekTime;

            this.progressBar.seeking = false;
        };

        // Sự kiện khi bài hát kết thúc
        this.audioPlayer.onended = () => {
            this.handleSongNavigation(this.NEXT_SONG);
        };
    },

    // Xử lý điều hướng bài hát (trước/sau)
    handleSongNavigation(direction) {
        // Luôn phát khi chuyển bài dù trước đó đang pause
        this.isPlaying = true;

        const shouldResetCurrentSong =
            this.audioPlayer.currentTime > this.PREV_RESET_TIME;

        // Nếu nhấn nút "trước" và bài hát đã phát > 2 giây, thì reset về đầu bài thay vì chuyển bài
        if (direction === this.PREV_SONG && shouldResetCurrentSong) {
            this.audioPlayer.currentTime = 0;
            return;
        }

        // Xác định bài hát tiếp theo
        if (this.isShuffleMode) {
            // Nếu đang ở chế độ shuffle, chọn bài ngẫu nhiên
            this.currentSongIndex = this.getRandomSongIndex();
        } else {
            // Nếu không, chuyển theo thứ tự
            this.currentSongIndex += direction;
        }

        // Xử lý chỉ số và cập nhật player
        this.handleNewSongIndex();
    },

    // Tạo chỉ số ngẫu nhiên cho bài hát (không trùng với bài hiện tại)
    getRandomSongIndex() {
        // Nếu chỉ có <= 1 bài thì không cần random
        if (this.songList.length <= 1) {
            return this.currentSongIndex;
        }

        let randomIndex = null;
        // Tạo số ngẫu nhiên cho đến khi khác với bài hiện tại
        do {
            randomIndex = Math.floor(Math.random() * this.songList.length);
        } while (randomIndex === this.currentSongIndex);

        return randomIndex;
    },

    // Xử lý khi có chỉ số bài hát mới
    handleNewSongIndex() {
        // Đảm bảo chỉ số luôn trong phạm vi hợp lệ (0 đến length-1)
        // Sử dụng modulo để tạo vòng lặp: -1 -> length-1, length -> 0
        this.currentSongIndex =
            (this.currentSongIndex + this.songList.length) %
            this.songList.length;

        // Thiết lập bài hát mới và render lại playlist
        this.setupCurrentSong();
        this.renderPlaylist();
    },

    // Cập nhật trạng thái nút lặp lại
    updateLoopButtonState() {
        this.audioPlayer.loop = this.isLoopMode;
        this.loopBtn.classList.toggle("active", this.isLoopMode);
    },

    // Cập nhật trạng thái nút phát ngẫu nhiên
    updateShuffleButtonState() {
        this.shuffleBtn.classList.toggle("active", this.isShuffleMode);
    },

    // Thiết lập bài hát hiện tại (tải file, cập nhật tiêu đề, thiết lập trạng thái)
    setupCurrentSong() {
        const currentSong = this.getCurrentSong();

        // Cập nhật tiêu đề bài hát đang phát
        this.currentSongTitle.textContent = currentSong.title;
        // Tải file audio
        this.audioPlayer.src = currentSong.filePath;

        // Cập nhật trạng thái các nút
        this.updateLoopButtonState();
        this.updateShuffleButtonState();

        // Sự kiện khi audio sẵn sàng phát
        this.audioPlayer.oncanplay = () => {
            // Chỉ tự động phát nếu đang trong trạng thái playing
            if (this.isPlaying) {
                this.audioPlayer.play();
            }
        };
    },

    // Lấy thông tin bài hát hiện tại
    getCurrentSong() {
        return this.songList[this.currentSongIndex];
    },

    // Toggle play/pause
    togglePlayPause() {
        if (this.audioPlayer.paused) {
            this.audioPlayer.play();
        } else {
            this.audioPlayer.pause();
        }
    },

    // Render danh sách bài hát ra HTML
    renderPlaylist() {
        const playlistHTML = this.songList
            .map((song, index) => {
                // Kiểm tra xem bài này có phải đang phát không
                const isCurrentSong = index === this.currentSongIndex;

                return `<div class="song ${isCurrentSong ? "active" : ""}">
                    <div
                        class="thumb"
                        style="
                            background-image: url('https://i.ytimg.com/vi/jTLhQf5KJSc/maxresdefault.jpg');
                        "
                    ></div>
                    <div class="body">
                        <h3 class="title">${this.escapeHTML(song.title)}</h3>
                        <p class="author">${this.escapeHTML(song.artist)}</p>
                    </div>
                    <div class="option">
                        <i class="fas fa-ellipsis-h"></i>
                    </div>
                </div>`;
            })
            .join("");

        // Cập nhật HTML của playlist
        this.playlistContainer.innerHTML = playlistHTML;
    },

    escapeHTML(html) {
        // Kiểm tra input có hợp lệ không
        if (typeof html !== "string") {
            return "";
        }

        // Tạo một temporary div element để sử dụng textContent
        // textContent tự động escape các ký tự đặc biệt
        const tempDiv = document.createElement("div");
        tempDiv.textContent = html;
        return tempDiv.innerHTML;
    },
};

// Khởi tạo music player khi trang web load xong
musicPlayer.initialize();
