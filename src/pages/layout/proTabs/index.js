import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Tabs, Menu, Dropdown, Space } from 'antd'
import { StickyContainer, Sticky } from 'react-sticky'
import { SyncOutlined, HeartTwoTone } from '@ant-design/icons'
import { MyErrorBoundary } from '@stateful'
import Loading from '@stateless/Loading'
import Home from '@pages/home'

import styles from './index.module.less'

const initialPanes = [
  {
    title: '首页',
    key: '/',
    content: <Home />,
    closable: false,
    path: '/',
  },
]

const renderTabBar = (props, DefaultTabBar) => (
  <Sticky topOffset={40} relative>
    {({ style }) => <DefaultTabBar {...props} className="pro-tabs" style={{ ...style }} />}
  </Sticky>
)

const ProTabs = (props) => {
  const [activeKey, setActiveKey] = useState('')
  const [panes, setPanes] = useState(initialPanes)
  const [isReload, setIsReload] = useState(false)
  const [selectedPanel, setSelectedPanel] = useState({})
  const pathRef = useRef('')

  const navigate = useNavigate()

  const { defaultActiveKey, panesItem, tabActiveKey } = props
  const { pathname, search } = useLocation()
  const fullPath = pathname + search

  // 从本地存储中恢复已打开的tab列表
  // const resetTabs = useCallback(() => {
  //   const { tabKey } = getKeyName(pathname)
  //   setPanes(initialPanes)
  //   setActiveKey(tabKey)
  // }, [pathname])

  // 初始化页面
  // useEffect(() => {
  //   resetTabs()
  // }, [resetTabs])

  useEffect(() => {
    const newPath = pathname + search

    if (!panesItem.path || panesItem.path === pathRef.current) return

    pathRef.current = newPath

    const index = panes.findIndex((item) => item.key === panesItem.key)

    if (!panesItem.key || (index > -1 && newPath === panes[index].path)) {
      setActiveKey(tabActiveKey)
      return
    }

    if (index > -1) {
      panes[index].path = newPath
      setPanes(panes)
      setActiveKey(tabActiveKey)
      return
    }

    setPanes([...panes, panesItem])
    setActiveKey(tabActiveKey)
    // storeTabs(panes)
  }, [panes, panesItem, pathname, search, tabActiveKey])

  const onChange = (activeKey) => {
    setActiveKey(activeKey)
  }

  // tab点击
  const onTabClick = (targetKey) => {
    const { path } = panes.filter((item) => item.key === targetKey)[0]
    navigate(path)
  }

  const onTabScroll = ({ direction }) => {
    console.log('direction', direction)
  }

  const onEdit = (targetKey, action) => {
    action === 'remove' && remove(targetKey)
  }

  const remove = (targetKey) => {
    const delIndex = panes.findIndex((item) => item.key === targetKey)
    const filterPanes = panes.filter((pane) => pane.key !== targetKey)
    // 删除非当前/当前tab
    if (targetKey !== activeKey) {
      setPanes(filterPanes)
      // storeTabs(panes) // 改变redux中数据
    } else {
      const nextPath = filterPanes[delIndex - 1].key
      navigate(nextPath)
      setActiveKey(nextPath)
      setPanes(filterPanes)
    }
  }

  const isDisabled = () => selectedPanel.key === '/'
  // 阻止右键默认事件
  const preventDefault = (event, panel) => {
    event.preventDefault()
    setSelectedPanel(panel)
  }

  // 刷新当前 tab
  const refreshTab = () => {
    setIsReload(true)
    setTimeout(() => {
      setIsReload(false)
    }, 1000)
  }

  // 关闭其他或关闭所有
  const removeAll = async (isRemoveAll) => {
    const { key } = selectedPanel
    navigate(isRemoveAll ? '/' : key)

    const homePanel = [
      {
        title: '首页',
        key: '/',
        content: <Home />,
        closable: false,
        path: '/',
      },
    ]

    const nowPanes = key !== '/' && !isRemoveAll ? [...homePanel, selectedPanel] : homePanel
    setPanes(nowPanes)
    navigate(nowPanes[0].key)
    setActiveKey(isRemoveAll ? '/' : key)
    // storeTabs(nowPanes)
  }

  // tab 右键菜单
  const tabRightMenu = (
    <Menu>
      <Menu.Item key="1" onClick={refreshTab} disabled={selectedPanel.key !== fullPath || selectedPanel.key === '/404'}>
        刷新
      </Menu.Item>
      <Menu.Item
        key="2"
        onClick={(e) => {
          e.domEvent.stopPropagation()
          remove(selectedPanel.key)
        }}
        disabled={isDisabled()}
      >
        关闭
      </Menu.Item>
      <Menu.Item
        key="3"
        onClick={(e) => {
          e.domEvent.stopPropagation()
          removeAll()
        }}
      >
        关闭其他
      </Menu.Item>
      <Menu.Item
        key="4"
        onClick={(e) => {
          e.domEvent.stopPropagation()
          removeAll(true)
        }}
        disabled={isDisabled()}
      >
        全部关闭
      </Menu.Item>
    </Menu>
  )

  // error boundary
  const fixError = () => {
    refreshTab()
  }

  return (
    <StickyContainer className={styles.container} id="container">
      {/* {`panes: ${JSON.stringify(panes, null, 2)}`} */}
      <Tabs
        hideAdd
        type="editable-card"
        onChange={onChange}
        onTabClick={onTabClick}
        onTabScroll={onTabScroll}
        onEdit={onEdit}
        renderTabBar={renderTabBar}
        tabBarGutter={0}
        tabBarStyle={{
          zIndex: 2,
        }}
        activeKey={activeKey}
        defaultActiveKey={defaultActiveKey}
        destroyInactiveTabPane
        className={styles.proTabs}
        tabBarExtraContent={{
          left: (
            <Space align="center" size={30} style={{ margin: '0 25px' }}>
              <HeartTwoTone twoToneColor="#eb2f96" />
              {/* &nbsp; */}
            </Space>
          ),
        }}
      >
        {panes.map((pane) => (
          <Tabs.TabPane
            forceRender // 被隐藏时是否渲染 DOM 结构
            key={pane.key}
            closable={pane.closable}
            tab={
              <Dropdown
                overlay={tabRightMenu}
                placement="bottomLeft"
                trigger={['contextMenu']}
                getPopupContainer={(node) => node.parentNode}
              >
                <span onContextMenu={(e) => preventDefault(e, pane)}>
                  {pane.key === fullPath && pane.key !== '/404' && (
                    <SyncOutlined onClick={refreshTab} title="刷新" spin={isReload} />
                  )}
                  {pane.title}
                </span>
              </Dropdown>
            }
          >
            {/* <pane.content path={pane.path} /> */}
            <MyErrorBoundary fixError={fixError}>
              <div className={styles.tabpanel}>
                {isReload && pane.key === fullPath && pane.key !== '/404' ? (
                  <Loading tip="刷新中..." />
                ) : (
                  <>{pane.content}</>
                )}
              </div>
            </MyErrorBoundary>
          </Tabs.TabPane>
        ))}
      </Tabs>
    </StickyContainer>
  )
}

export default ProTabs
