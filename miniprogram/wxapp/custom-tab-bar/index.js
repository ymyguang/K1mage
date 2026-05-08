Component({
  data: {
    selected: 0,
    tabs: [
      {
        text: '首页',
        pagePath: '/pages/index/index'
      },
      {
        text: '我的',
        pagePath: '/pages/my/my'
      }
    ]
  },

  methods: {
    switchTab(event) {
      const { index, path } = event.currentTarget.dataset
      if (index === this.data.selected) return

      wx.switchTab({
        url: path,
      })
    }
  }
})
