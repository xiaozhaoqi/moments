//self.js
Page({
    // 页面根数据
    data: {
        bgiURL: '',
        avatarUrl: '',
        nickName: '',
        page: 1,
        pageSize: 10,
        hasMoreData: true,
        stateList: [],
        showMenu: [],
        listNickName: ''
    },
    // 控制每条动态的菜单按钮
    clickmenu: function (item) {
        const index = item.target.dataset.index
        let menu = this.data.showMenu;
        if (menu[index]) {
            menu[index] = false
            this.setData({
                showMenu: menu
            })
        }
        else {
            menu[index] = true
            this.setData({
                showMenu: menu
            })
        }
    },
    refreshBGI: function () {
        const db = wx.cloud.database()
        db.collection('BGI')
            .where({
                username: this.data.nickName
            })
            .orderBy('time_stamp', 'desc')
            .limit(1)
            .get()
            .then(res => {
                const stamp = res.data[0].time_stamp
                if (res.data.length == 1) {
                    wx.cloud.getTempFileURL({
                        fileList: [res.data[0].fileid],
                        success: res => {
                            this.setData({
                                bgiURL: res.fileList[0].tempFileURL
                            })
                        }
                    })
                }
            })
            .catch(err => {
                console.error(err)
            })
        this.firstTimeGetList()
    },
    // 点击相册封面更换图片->调用系统相册->上传图片到云存储->写用户与图片的映射到云数据库
    clickBGI: function () {
        wx.showActionSheet({
            itemList: [
                '更换相册封面'
            ],
            success: (res) => {
                wx.chooseImage({
                    count: 1,
                    success: (res) => {
                        const stamp = new Date().getTime()
                        wx.cloud.uploadFile({
                            cloudPath: this.data.nickName + stamp + '.png',
                            filePath: res.tempFilePaths[0],
                            success: res => {
                                const db = wx.cloud.database()
                                db.collection('BGI').add({
                                    data: {
                                        username: this.data.nickName,
                                        fileid: res.fileID,
                                        time_stamp: stamp
                                    },
                                    success: () => {
                                        this.refreshBGI()
                                    },
                                    fail: (err) => { console.log(err) }
                                })
                            },
                            fail: (err) => { console.log(err) }
                        })
                    }
                })
            }
        })
    },
    // 点击头像，跳转到个人相册页面
    clickAvatar: function () {
        wx.navigateTo({
            url: '../self/self?nickName=' + this.data.nickName + '&avatarUrl=' + this.data.avatarUrl + '&bgiURL=' + this.data.bgiURL
        })
    },
    // 滑到底部，加载更早的动态，直到没有数据为止
    getOlderList: function () {
        const db = wx.cloud.database()
        let menu = this.data.showMenu
        let stateListCopy = this.data.stateList
        db.collection('StateItems')
            .where({
                user_nickName: this.data.listNickName
            })
            .orderBy('time_stamp', 'desc')
            .skip(this.data.page * this.data.pageSize)
            .limit(10)
            .get()
            .then(res => {
                for (let i = 0; i < res.data.length; i++) {
                    menu.push(false)
                }
                let contentlist = res.data
                if (contentlist.length < this.data.pageSize) {
                    this.setData({
                        stateList: stateListCopy.concat(contentlist),
                        hasMoreData: false,
                        showMenu: menu
                    }, () => {
                        for (let i = 0; i < this.data.stateList.length; i++) {
                            if (this.data.stateList[i].image) {
                                if (this.data.stateList[i].image.indexOf('http') == -1) {
                                    wx.cloud.getTempFileURL({
                                        fileList: [this.data.stateList[i].image],
                                        success: (res) => {
                                            let stateListCopy = this.data.stateList
                                            stateListCopy[i].image = res.fileList[0].tempFileURL
                                            this.setData({
                                                stateList: stateListCopy
                                            })
                                        }
                                    })
                                }
                            }
                        }
                    })
                } else {
                    this.setData({
                        stateList: stateListCopy.concat(contentlist),
                        hasMoreData: true,
                        page: this.data.page + 1,
                        showMenu: menu
                    }, () => {
                        for (let i = 0; i < this.data.stateList.length; i++) {
                            if (this.data.stateList[i].image) {
                                if (this.data.stateList[i].image.indexOf('http') == -1) {
                                    wx.cloud.getTempFileURL({
                                        fileList: [this.data.stateList[i].image],
                                        success: (res) => {
                                            let stateListCopy = this.data.stateList
                                            stateListCopy[i].image = res.fileList[0].tempFileURL
                                            this.setData({
                                                stateList: stateListCopy
                                            })
                                        }
                                    })
                                }
                            }
                        }
                    })
                }
            })
            .catch(err => {
                console.error(err)
            })
    },
    // 下拉刷新，加载最新的动态，并初始化列表
    firstTimeGetList: function () {
        const db = wx.cloud.database()
        let menu = []
        db.collection('StateItems')
            .where({
                user_nickName: this.data.listNickName
            })
            .orderBy('time_stamp', 'desc')
            .limit(10)
            .get()
            .then(res => {
                for (let i = 0; i < res.data.length; i++) {
                    menu.push(false)
                }
                this.setData({
                    stateList: res.data,
                    showMenu: menu,
                    hasMoreData: true,
                    page: 1
                }, () => {
                    for (let i = 0; i < this.data.stateList.length; i++) {
                        if (this.data.stateList[i].image) {
                            wx.cloud.getTempFileURL({
                                fileList: [this.data.stateList[i].image],
                                success: (res) => {
                                    let stateListCopy = this.data.stateList
                                    stateListCopy[i].image = res.fileList[0].tempFileURL
                                    this.setData({
                                        stateList: stateListCopy
                                    })
                                }
                            })
                        }
                    }
                })
            })
            .catch(err => {
                console.error(err)
            })
    },
    // 生命周期函数，页面加载后执行
    onLoad: function (option) {
        console.log(option)
        this.setData({
            nickName: option.nickName,
            avatarUrl: option.avatarUrl,
            bgiURL: option.bgiURL
        }, () => {
            let name = 'listNickName' in option ? option.listNickName : this.data.nickName
            this.setData({
                listNickName: name
            }, () => {
                this.firstTimeGetList()
                this.refreshBGI()
            })
        })

    },
    // 生命周期函数，下拉刷新时触发
    onPullDownRefresh: function () {
        this.firstTimeGetList()
        wx.stopPullDownRefresh()
        wx.showToast({
            title: '刷新中',
            icon: 'loading'
        })
    },
    // 生命周期函数，滑到底部时触发
    onReachBottom: function () {
        if (this.data.hasMoreData) {
            this.getOlderList()
        } else {
            wx.showToast({
                title: '已经到底啦',
            })
        }
    },
    // 生命周期函数，点击分享时触发
    onShareAppMessage: function (res) {
        return {
            title: this.data.nickName + '分享给你',
            path: '/page/index/index'
        }
    }
})
