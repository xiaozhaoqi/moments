//index.js
const app = getApp()

Page({
    // 页面根数据
    data: {
        info: false,
        bgiURL: '',
        avatarUrl: '',
        nickName: '',
        text: '',
        page: 1,
        pageSize: 10,
        hasMoreData: true,
        stateList: [],
        showMenu: [],
        formImageId: '',
        imageStamp: 0,
        submitDisabled: false
    },
    // 点击启动页按钮，获取用户信息，初始化相册封面，获取最新动态
    clickGetInfo: function (res) {
        this.setData({
            info: true,
            avatarUrl: res.detail.userInfo.avatarUrl,
            nickName: res.detail.userInfo.nickName,
        }, () => {
            const db = wx.cloud.database()
            db.collection('BGI')
                .where({
                    username: this.data.nickName
                })
                .orderBy('time_stamp', 'desc')
                .limit(1)
                .get()
                .then(res => {
                    console.log(res)
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
        })
    },
    // 发动态时选择图片
    chooseImage: function () {
        wx.chooseImage({
            count: 1,
            success: (res) => {
                this.setData({
                    submitDisabled: true
                }, () => {
                    const stamp = new Date().getTime()
                    wx.cloud.uploadFile({
                        // 将用户选择的图片上传至云存储，命名方式：用户名+时间戳+图片序号，防止命名冲突覆盖存储
                        cloudPath: this.data.nickName + stamp + '.png',
                        filePath: res.tempFilePaths[0],
                        success: (res) => {
                            console.log(res)
                            this.setData({
                                submitDisabled: false,
                                formImageId: res.fileID,
                                imageStamp: stamp
                            })
                        },
                        fail: (err) => { console.log(err) }
                    })
                })
            }
        })
    },
    // 发送动态按钮
    clickme: function (res) {
        if (this.data.text == '' && this.data.formImageId == '') {
            wx.showToast({
                title: '说点什么吧',
                icon: 'none'
            })
        }
        else {
            // if (this.data.formImageId == '') {
            //     const db = wx.cloud.database()
            //     const that = this
            //     db.collection('StateItems').add({
            //         data: {
            //             content: this.data.text,
            //             comment: '',
            //             like: '',
            //             time: new Date().toLocaleString(),
            //             time_stamp: new Date().getTime(),
            //             user_nickName: this.data.nickName,
            //             user_avatar: this.data.avatarUrl
            //         },
            //         success: (res) => {
            //             wx.showToast({
            //                 title: '发送成功'
            //             })
            //             that.setData({
            //                 text: ''
            //             })
            //             that.firstTimeGetList()
            //         }
            //     })
            // }
            // else {
                const db = wx.cloud.database()
                const that = this
                db.collection('StateItems').add({
                    data: {
                        content: this.data.text,
                        comment: '',
                        like: '',
                        time: new Date().toLocaleString(),
                        time_stamp: new Date().getTime(),
                        user_nickName: this.data.nickName,
                        user_avatar: this.data.avatarUrl,
                        image: this.data.formImageId,
                        imageStamp: this.data.imageStamp
                    },
                    success: (res) => {
                        wx.showToast({
                            title: '发送成功'
                        })
                        that.setData({
                            text: ''
                        })
                        that.firstTimeGetList()
                    }
                })
            // }
        }
    },
    // 输入框
    inputOnChange: function (e) {
        this.setData({
            text: e.detail.value
        })
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
                                        this.clickGetInfo({
                                            detail: {
                                                userInfo: {
                                                    avatarUrl: this.data.avatarUrl,
                                                    nickName: this.data.nickName
                                                }
                                            }
                                        })
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
    clickAvatar: function (item) {
        if('nickname' in item.target.dataset)
        {
            console.log(item.target.dataset.nickname)
            wx.navigateTo({
                url: '../self/self?nickName=' + this.data.nickName + '&avatarUrl=' + this.data.avatarUrl + '&bgiURL=' + this.data.bgiURL + '&listNickName=' + item.target.dataset.nickname
            })
        }
        else
        {
            wx.navigateTo({
                url: '../self/self?nickName=' + this.data.nickName + '&avatarUrl=' + this.data.avatarUrl + '&bgiURL=' + this.data.bgiURL
            })
        }
        
    },
    // 点赞
    clickLike: function (item) {
        console.log(item)
        const index = item.target.dataset.index
        const db = wx.cloud.database()
        let likes = this.data.stateList[index].like + this.data.nickName
        let stateListCopy = this.data.stateList
        stateListCopy[index].like = likes
        this.setData({
            stateList: stateListCopy
        })
        db.collection('StateItems').doc(this.data.stateList[index]._id).update({
            // data 传入需要局部更新的数据
            data: {
                like: likes
            },
            success: console.log,
            fail: console.error
        })
    },
    // 跳转到帮助文档
    clickHelp: function(){
        wx.navigateTo({
            url: '../help/help'
        })
    },
    // 滑到底部，加载更早的动态，直到没有数据为止
    getOlderList: function () {
        const db = wx.cloud.database()
        let menu = this.data.showMenu
        let stateListCopy = this.data.stateList
        db.collection('StateItems')
            .where({})
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
            .where({})
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
    onLoad: function () {
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
