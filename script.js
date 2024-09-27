const app = Vue.createApp({
  data() {
    return {
      selectedArea: '',
      selectedTags: [],
      areas: [
        '中壢區',
        '平鎮區',
        '龍潭區',
        '楊梅區',
        '新屋區',
        '觀音區',
        '桃園區',
        '龜山區',
        '八德區',
        '大溪區',
        '復興區',
        '大園區',
        '蘆竹區',
      ],
      tags: [], // 用於動態存儲標籤
      jsonData: [], // 儲存從新API讀取的影片資料
      loading: true,
      error: null,
    };
  },
  computed: {
    filteredVideos() {
      return this.jsonData
        .filter((video) => {
          const areaMatch =
            !this.selectedArea || video.area.includes(this.selectedArea);
          const tagMatch =
            this.selectedTags.length === 0 ||
            this.selectedTags.every((tag) => video.tags.includes(tag));
          return areaMatch && tagMatch;
        })
        .map((video) => ({
          ...video,
          address: video.address.replace(/<br>/g, '\n'), // 處理地址中的換行符號
        }));
    },
  },
  watch: {
    filteredVideos: {
      handler() {
        this.$nextTick(() => {
          this.reloadInstagramEmbeds(); // 當Vue更新DOM時，重新加載Instagram影片
        });
      },
      deep: true,
    },
  },
  mounted() {
    this.fetchData(); // 當Vue應用加載完成後，開始獲取數據
  },
  methods: {
    async fetchData() {
      try {
        const response = await fetch('http://fydra.ddns.net/reels');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        this.jsonData = this.transformData(data); // 儲存影片資料
        this.extractTags(this.jsonData); // 從影片資料中提取標籤
        this.loading = false;
        this.$nextTick(() => {
          this.reloadInstagramEmbeds(); // 初次數據加載完成後，重新加載Instagram影片
        });
      } catch (error) {
        this.error = error.message;
        this.loading = false;
      }
    },
    transformData(data) {
      return data.map((video) => ({
        Id: video.Id,
        title: video.title,
        description: video.description,
        area: video.area,
        tags: video.tags,
        address: video.address.replace(/<br>/g, '\n'), // 處理地址中的換行符號
        embedUrl: this.convertInstagramUrl(video.embedUrl),
      }));
    },
    extractTags(data) {
      const tagSet = new Set(); // 使用Set去重
      data.forEach((video) => {
        video.tags.split(',').forEach((tag) => tagSet.add(tag.trim()));
      });
      this.tags = Array.from(tagSet).sort(); // 將Set轉換為Array並存儲到`tags`中，並按字母順序排序
    },
    reloadInstagramEmbeds() {
      if (window.instgrm) {
        window.instgrm.Embeds.process();
      } else {
        setTimeout(() => {
          if (window.instgrm) {
            window.instgrm.Embeds.process();
          }
        }, 1000);
      }
    },
    convertInstagramUrl(url) {
      const regex = /https:\/\/www\.instagram\.com\/reel\/([^/?]+).*/;
      const match = url.match(regex);
      if (match) {
        return `https://www.instagram.com/reel/${match[1]}/?utm_source=ig_embed&utm_campaign=loading`;
      }
      return url;
    },
  },
});

app.mount('#app');
