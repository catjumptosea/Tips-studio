import helpSceneBad from '../assets/help-scene-bad.png'
import helpSceneGood from '../assets/help-scene-good.png'
import billOmitYenReplacement from '../assets/data-formats/bill-omit-yen-copy.png'
import punctuationTitleGood from '../assets/data-formats/punctuation-title-example-good.png'
import punctuationTitleBad from '../assets/data-formats/punctuation-title-example-bad.png'
import punctuationBubbleGood from '../assets/data-formats/punctuation-bubble-example-good.png'
import punctuationBubbleBad from '../assets/data-formats/punctuation-bubble-example-bad.png'
import yuanUnitPositionExample from '../assets/data-formats/yuan-unit-position-example.png'
import priceRangeRoomyCopy from '../assets/data-formats/price-range-roomy-copy.png'
import priceRangeTightCopy from '../assets/data-formats/price-range-tight-copy.png'
import billFlowBidirectional from '../assets/data-formats/bill-flow-bidirectional.png'
import billFlowIncomeMain from '../assets/data-formats/bill-flow-income-main.png'
import billFlowExpenseMain from '../assets/data-formats/bill-flow-expense-main.png'
import receiptDiscountCopy from '../assets/data-formats/receipt-discount-copy.png'

export type SpecExample = {
  good: string
  bad?: string
  goodImage?: string
  badImage?: string
  links?: string[]
}

export type SpecItem = {
  id: string
  title: string
  description?: string
  rules?: SpecRule[]
  examples?: SpecExample[]
}

export type SpecRule =
  | string
  | {
      title?: string
      text?: string
      examples?: SpecExample[]
      children?: SpecRule[]
      table?: SpecRuleTable
      demoImage?: string
      demoAlt?: string
      groupTitle?: string
      groupRules?: SpecRule[]
    }

export type SpecRuleTableCell = {
  text: string
  highlight?: string
}

export type SpecRuleTableRow = {
  cells: SpecRuleTableCell[]
  muted?: boolean
}

export type SpecRuleTable = {
  headers: string[]
  rows: SpecRuleTableRow[]
}

export type LexiconRow = {
  id: string
  columns: string[]
}

export type SpecLexiconTable = {
  title: string
  headers: string[]
  rows: LexiconRow[]
}

export type SpecLexicon = {
  id: string
  title: string
  description: string
  headers: string[]
  rows: LexiconRow[]
  tables?: SpecLexiconTable[]
}

export type SpecSection = {
  id: string
  number: string
  title: string
  shortTitle: string
  intro: string
  kind: 'items' | 'lexicon'
  items: SpecItem[]
  lexicons?: SpecLexicon[]
}

export const specSections: SpecSection[] = [
  {
    id: 'introduction',
    number: '',
    title: '介绍',
    shortTitle: '介绍',
    intro: '本指南面向初次接触内容规范的设计、产品与运营人员，帮助你快速建立界面文案的表达逻辑，也帮助你了解后续写作提升方向。\n\n适用对象：\n- 设计师：确认界面文案的表达与层级\n- 产品经理：规范需求描述与方案文案\n- 运营人员：统一营销信息、提示语和常用话术\n- 研发人员：规范报错、数据展示和特殊处理文案\n\n阅读顺序：\n1. 先看「基础原则」，建立准确、一致、易读、可信的表达基线\n2. 再按当前工作场景查阅对应章节，如报错看「报错策略」，金额与数值看「数据策略」\n3. 遇到词汇争议时，到「常用词汇」统一用法\n\n查证与示例：\n- 正确示范代表推荐写法\n- 错误示范代表需要避免的写法\n- 数据策略等章节包含表格和图片示范\n- 括号与引用等细节可在「标点符号」中快速核对',
    kind: 'items',
    items: [],
  },
  {
    id: 'principles',
    number: '01',
    title: '基础原则',
    shortTitle: '基础原则',
    intro: '内容认知准确、无歧义，保持表达一致性、易读性和信赖感。',
    kind: 'items',
    items: [
      {
        id: 'accuracy',
        title: '准确性',
        description: '内容认知准确，无歧义，不模糊。',
        rules: [
          {
            text: '中文用词规范，避免错别字。',
            examples: [{ good: '登录', bad: '登陆' }],
          },
          {
            text: '英文用词规范，注意大小写。',
            examples: [{ good: 'SaaS', bad: 'saas' }],
            children: [
              '产品概念名称缩写一般需使用大写字母，如：BBS、POS；但对于某些概念名称，需使用原有格式，如：SaaS。',
              '专有名词需使用原有格式，如：iOS、Android。',
              '全英文的标题、标签、菜单项等需遵循英文句式中首字母大写的规范。',
              '语句文案中的英文单词不做特殊的大小写处理，如：bug、level。',
            ],
          },
          {
            text: '指代明确，尽量不在同一个句式中同时使用“你”和“我”两个人称代词。',
            examples: [{ good: '请在“我的设置”中修改个人信息', bad: '请在“我的设置”修改你的信息' }],
          },
          {
            text: '内容传达准确，承接上下文表述，并准确引导用户行为。',
            examples: [{ good: '确认无误后，点击「提交」完成操作。', bad: '确认无误，点击提交。' }],
          },
          '信息展示符合场景，根据使用场景与用户类型，提供真正有价值的信息。',
        ],
      },
      {
        id: 'consistency',
        title: '一致性',
        description: '在相同性质的内容表达中，需保持表达的一致性，避免造成语义混淆。',
        rules: [
          {
            text: '统一句式，不使用被动语态，简化表达，便于用户理解语义。',
            examples: [
              { good: '商品发布成功', bad: '商品已被成功发布' },
              { good: '「图片上传失败」「故事发布失败」', bad: '「图片上传失败」「发布故事失败」' },
            ],
          },
          {
            text: '表达描述同一概念时，避免不同词汇混用。',
            examples: [{ good: '「验证码」', bad: '「校验码」、「动态码」' }],
          },
          {
            text: '数据格式一致',
            children: [
              {
                text: '使用数字进行计量、编号时，为达到醒目的效果，需使用阿拉伯数字。',
                examples: [{ good: '你有 3 条系统通知', bad: '你有三条系统通知' }],
              },
              {
                text: '计量单位存在对应的“国际单位制”英文缩写表达时，需使用英文缩写。',
                examples: [{ good: '208.32 kg', bad: '208.32 千克' }],
              },
              {
                text: '使用“-”表达数值范围时，单位应跟在第二个数值之后。',
                examples: [{ good: '400-500 件', bad: '400 件-500 件' }],
              },
            ],
          },
        ],
      },
      {
        id: 'readability',
        title: '易读性',
        description: '提高内容的阅读与理解效率。',
        rules: [
          {
            text: '简化句式，尽量使用简单句式，降低句式和信息表达复杂程度。',
            examples: [{ good: '报表数据已同步，请下载查看。', bad: '请下载查看已经同步的报表数据' }],
          },
          {
            text: '精简信息，在信息准确完整表达的前提下，不重复表达用户已知信息。',
            examples: [{ good: '修改成功', bad: '修改门店信息成功' }],
          },
          {
            text: '表述专业严谨，口语虽亲切，但过度使用会影响产品专业性与严谨性。',
            examples: [{ good: '报表数据已同步，请下载查看。', bad: '亲，数据已经同步完成了，可以下载查看哦～。' }],
          },
          {
            text: '结构化地组织内容，使用段落、编号或无编号列表、合适的停顿和空格等，便于高效率的视觉扫描。',
            examples: [
              {
                good: '导入成功：共 128 条，其中 3 条失败，失败原因见下方表格。',
                bad: '导入结果：总共128条数据，有3条失败，失败的3条原因分别如下第一条是因为手机号格式不对第二条是因为邮箱重复第三条是因为地区为空。',
              },
            ],
          },
          {
            text: '区分重点地呈现内容，使用合适的字号、行高、段落间距、行字数等方法，使信息层级更明确、阅读更高效。',
            examples: [
              {
                good: '商品已下架\n原因：库存不足',
                bad: '商品已经下架了出现什么情况都会导致库存不足请联系你的管理员和客服会帮你处理',
              },
            ],
          },
        ],
      },
      {
        id: 'trust',
        title: '信赖感',
        description: '明确清晰、可记忆、符合产品调性的内容表达。',
        rules: [
          {
            text: '平等沟通：使用第二人称“你”，与用户平等自然地交流。',
            examples: [{ good: '恭喜你，审核认证通过！', bad: '恭喜您，审核认证通过！' }],
          },
          {
            text: '积极表达：使用友善、尊重的语气，避免生硬的指令。',
            examples: [{ good: '请输入手机号', bad: '手机号必须填写' }],
          },
          {
            text: '谦逊：避免使用“绝对”“一定”等过于极端的词汇。',
            examples: [{ good: '通常会在 1 个工作日内完成审核', bad: '一定会在 1 个工作日内完成审核' }],
          },
          {
            text: '用语符合行业标准但不难理解，不生造词、不随意挪用。',
            examples: [
              { good: '商品寄存服务', bad: '商品存放服务' },
              { good: '客户分群', bad: 'RFM 模型' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'help',
    number: '02',
    title: '帮助策略',
    shortTitle: '帮助策略',
    intro: '克制、针对地提供帮助，并在用户可能遇到问题的场景中给出提示。',
    kind: 'items',
    items: [
      {
        id: 'restrained-help',
        title: '克制地提供帮助',
        rules: [
          '通过自解释，让用户即看、即懂、即会使用，降低用户寻求帮助的概率。',
          '使用提示时尽量选择更轻量的提示形式，减少对用户的干扰。',
          '当无法通过轻量提示达到目的时，可引导用户查看帮助文档。',
        ],
      },
      {
        id: 'targeted-help',
        title: '针对性地提供帮助',
        rules: [
          '初级用户：使用最简单的方式，按照产品的常规使用步骤提供帮助。',
          '中级用户：在其遇到问题时提供帮助。',
          '高级用户：引导其在帮助中心查阅完整详细的操作说明。',
        ],
      },
      {
        id: 'scene-help',
        title: '在场景中提供帮助',
        description: '在用户可能遇到问题或产生困惑的场景中，根据具体场景设置提示，帮助用户解决问题或解答困惑。',
        examples: [
          {
            good: '在场景中提供帮助',
            bad: '未在场景中提供帮助',
            goodImage: helpSceneGood,
            badImage: helpSceneBad,
          },
        ],
      },
    ],
  },
  {
    id: 'naming',
    number: '03',
    title: '命名策略',
    shortTitle: '命名策略',
    intro: '命名以专业、直白为基调，兼顾产品长远定位和品牌推广需要。',
    kind: 'items',
    items: [
      {
        id: 'professional-terms',
        title: '用词专业严谨',
        description: '使用行业通用的专业表达，不生造、不随意挪用其他语境的近似词，避免影响用户理解并产生误导。',
        examples: [{ good: '商品寄存服务', bad: '商品存放服务' }],
      },
      {
        id: 'plain-naming',
        title: '直白描述为主',
        description: '常规功能与概念应简单直白地描述作用或概念，避免过多包装增加认知理解成本；只有在产品已形成稳定心智时，才可使用更产品化的命名。',
        examples: [
          { good: '数据概况', bad: '数据作战面板' },
          { good: '数据看板', bad: '数据作战面板' },
        ],
      },
      {
        id: 'concept-packaging',
        title: '适时使用概念包装',
        description: '品牌宣传、运营推广等特定场景下可适当进行概念包装，但包装应短小、有记忆点、有品牌感，不能影响常规功能的理解。',
        examples: [
          { good: '福昕电子签章', bad: '电子签名合规化解方案' },
          { good: '品牌担保', bad: '品牌提供的电商信任问题担保方案' },
        ],
      },
      {
        id: 'long-term-positioning',
        title: '考虑产品的长远定位',
        description: '产品功能会持续迭代演进，命名需考虑长远定位，使用能包容未来形态的概念，保证沿用性和扩展性。',
        examples: [
          { good: '知识付费', bad: '课程付费' },
          { good: '知识付费', bad: '专栏付费' },
        ],
      },
      {
        id: 'avoid-negative-association',
        title: '避免负面联想与歧义',
        description: '命名时避免谐音误读、近似字形误读、错误联想和负面联想。',
        examples: [
          { good: '优惠券', bad: '优惠卷' },
          { good: '定金膨胀', bad: '定金翻倍返还' },
        ],
      },
    ],
  },
  {
    id: 'error',
    number: '04',
    title: '报错策略',
    shortTitle: '报错策略',
    intro: '报错要说明原因、给行动建议，并使用正确语调。',
    kind: 'items',
    items: [
      {
        id: 'clear-error-reason',
        title: '明确简洁地说明出错原因',
        description: '告诉用户错误原因，而不是仅告知错误事实，并保持简洁。',
        examples: [{ good: '试用已结束，该功能无法使用。', bad: '对不起，该功能无法使用。' }],
      },
      {
        id: 'action-advice',
        title: '给出下一步的行动建议',
        description: '告诉用户存在问题后，应进一步给出解决问题的办法。',
        examples: [{ good: '内存不足，请先清理内存。', bad: '内存不足' }],
      },
      {
        id: 'avoid-over-explaining',
        title: '避免过度解释',
        description: '明确简洁地告诉用户如何解决问题，不要做过多解释说明。',
        examples: [
          {
            good: '上传失败，请上传 2M 以内的图片。',
            bad: '上传失败，请检查上传图片，将图片大小控制在 2M 以内，重新上传。',
          },
        ],
      },
      {
        id: 'avoid-negative-words',
        title: '避免否定词汇',
        description: '错误提示中尽量避免否定或消极的词汇，优先使用正向、建设性的表达。',
        examples: [
          {
            good: '请补充完整信息后再提交。',
            bad: '您提交的信息不完整，不能提交。',
          },
        ],
      },
      {
        id: 'avoid-technical-terms',
        title: '避免技术用语',
        description: '使用简单通俗的用语，避免技术用语的解释与透出。',
        examples: [
          {
            good: '网络连接断开，请检查网络设置。',
            bad: '请求失败，通用网络错误，错误编号 500。',
          },
        ],
      },
      {
        id: 'correct-tone',
        title: '使用正确的语调',
        rules: [
          '不责备用户，平等积极地与用户沟通。',
          '由于产品系统本身造成的问题，需向用户说明，同时表达歉意。',
        ],
        examples: [
          { good: '图片上传失败，请检查上传格式要求。', bad: '操作错误，图片上传失败' },
          { good: '非常抱歉，系统异常，工作人员正在全力抢修。', bad: '系统异常' },
        ],
      },
    ],
  },
  {
    id: 'punctuation',
    number: '05',
    title: '标点符号',
    shortTitle: '标点符号',
    intro: '统一标点符号的使用规范。',
    kind: 'items',
    items: [
      {
        id: 'punctuation-basic',
        title: '基本规范',
        rules: [
          {
            title: '基本标点规范',
            text: '',
            children: [
              {
                text: '疑问句、感叹句句尾，结尾需添加标点符号。',
                examples: [
                  {
                    good: '确定删除历史记录？',
                    bad: '确定删除历史记录',
                  },
                ],
              },
              '具体使用请参考 1995 年中国标准出版社出版的《标点符号用法》。',
            ],
          },
          {
            title: '文案语气风格与标点符号',
            text: '',
            children: [
              '文案表达需保持平和与冷静，需克制或尽量不使用叹号“！”。',
              '文案表达需保持正式与严谨，不应使用无实质意义的聊天式标点，如“~”。',
            ],
          },
        ],
      },
      {
        id: 'punctuation-period',
        title: '句号的使用',
        rules: [
          {
            title: '结尾无需添加句号的情况',
            text: '',
            children: [
              {
                text: '标题、副标题、标签、轻提示（toast）。',
                examples: [
                  {
                    good: '正确示范',
                    bad: '错误示范',
                    goodImage: punctuationTitleGood,
                    badImage: punctuationTitleBad,
                  },
                ],
              },
              '文本居中显示的提示条，内容为营销性质（通常带有具体金额数字）的提示条。',
            ],
          },
          {
            title: '结尾需要添加句号的情况',
            text: '',
            children: [
              '表单输入框下的提示文本。',
              '除上述“结尾无需添加句号”以外的提示条。',
            ],
          },
          {
            title: '句中包含句号，结尾需加句号，反之不加',
            text: '',
            children: [
              '输入框暗提示、输入框报错提示、IM 内的消息提示、缺省文案、居中显示的说明文本。',
            ],
          },
          {
            title: '非单一句式，结尾需添加句号',
            text: '',
            children: [
              {
                text: '在气泡提示中，如果提示文本为非单一句式（文本中包含其他标点符号），结尾需添加标点符号。',
                examples: [
                  {
                    good: '正确示范',
                    bad: '错误示范',
                    goodImage: punctuationBubbleGood,
                    badImage: punctuationBubbleBad,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'punctuation-space',
        title: '空格的使用',
        rules: [
          {
            title: '空格的使用',
            text: '',
            children: [
              {
                text: '中文与阿拉伯数字，英文，“+”、“-”、“＆”等符号混排时，使用空格作为间隔。',
                examples: [
                  {
                    good: '你有 30 条未读消息，请及时查看\n请在 BBS 查看最产品最新功能介绍\n请在“设置 - 店铺设置”中进行设置',
                  },
                ],
              },
              {
                text: '英文与阿拉伯数字，使用空格作为间隔。',
                examples: [
                  {
                    good: '请升级至 iOS 12 以上版本',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'data',
    number: '06',
    title: '数据策略',
    shortTitle: '数据策略',
    intro: '统一金额、数值、日期、脱敏、加载与特殊用法的显示规则。',
    kind: 'items',
    items: [
      {
        id: 'amount',
        title: '金额',
        description: '货币的说明对象以人民币为例。',
        rules: [
          {
            title: '金额单位使用区分',
            text: '',
            children: ['点式文本使用“¥”，句子中使用“元”。'],
            table: {
              headers: ['点式', '短句式', '段落式'],
              rows: [
                {
                  cells: [
                    { text: '¥' },
                    { text: '元' },
                    { text: '元' },
                  ],
                },
                {
                  cells: [
                    { text: '账户余额', highlight: '100' },
                    { text: '满3件减10元\n满900元送100元\n满50元可用\n100积分+1.2元' },
                    { text: '如果你消费2000元，本店将再送一张100元的储值卡。\n李小姐周五在本店消费300元，我们决定送她一次免费SPA。' },
                  ],
                },
                {
                  muted: true,
                  cells: [
                    { text: '原价、现价、付款额等' },
                    { text: '优惠券、营销信息等' },
                    { text: '用户须知、规则详情等' },
                  ],
                },
              ],
            },
          },
          {
            title: '金额单位省略说明',
            text: '',
            children: [
              '当处于一些营销场景，且不产生歧义的情况下允许省略“元”。',
              {
                text: '账单列表场景需省略“¥”。',
                children: [
                  {
                    text: '如业务有特殊需要，可将“元”前置或省略（需保证无歧义）。',
                    demoImage: yuanUnitPositionExample,
                    demoAlt: '“元”前置或省略示例',
                  },
                  {
                    text: '账单列表省略“¥”，收入用“+”，支出用“-”。',
                    demoImage: billOmitYenReplacement,
                    demoAlt: '账单列表省略“¥”',
                  },
                ],
              },
            ],
          },
          {
            title: '“万元”以上的展示规则',
            text: '',
            children: ['允许“万元”写法，但不做强制要求；写作“100,000元”亦可。'],
          },
          {
            title: '价格范围',
            text: '',
            children: [
              {
                text: '允许使用“XX起”的写法。',
                children: [
                  {
                    text: '价格处于一个范围，空间足够的情况下。',
                    demoImage: priceRangeRoomyCopy,
                    demoAlt: '价格范围空间足够时示例',
                  },
                  {
                    text: '价格处于一个范围，空间不够的情况下。',
                    demoImage: priceRangeTightCopy,
                    demoAlt: '价格范围空间不够时示例',
                  },
                ],
              },
            ],
          },
          {
            title: '小数位数保留',
            text: '',
            children: [
              '一般情况下保留两位小数。',
              '特殊场景如存货核算、存活批次、库存核算等允许 3 位和 4 位小数。',
            ],
          },
          {
            title: '正负号使用',
            text: '',
            children: [
              {
                text: '账单等，收入与支出同时存在，收入用“+”，支出用“-”。',
                children: [
                  {
                    text: '双向流动账单',
                    demoImage: billFlowBidirectional,
                    demoAlt: '双向流动账单示例',
                  },
                  {
                    text: '单向走账为主-收入为主',
                    demoImage: billFlowIncomeMain,
                    demoAlt: '单向走账为主收入示例',
                  },
                  {
                    text: '单向走账为主-支出为主',
                    demoImage: billFlowExpenseMain,
                    demoAlt: '单向走账为主支出示例',
                  },
                ],
              },
              {
                text: '小票、明细等，以支出为主，有部分减免或折扣，支出无符号，减免和折扣用“-”（即使减免为 0 也用“-”）。',
                demoImage: receiptDiscountCopy,
                demoAlt: '小票、明细减免折扣示例',
              },
            ],
          },
        ],
      },
      {
        id: 'number',
        title: '数值',
        rules: [
          {
            title: '千分符使用',
            text: '',
            children: [
              '一般数据不需使用千分符。',
              '在数据、资产、财务等以数据为主的业务模块中应使用千分符。',
              '在数据统计模块，单独的数值显示应使用千分符。',
            ],
          },
          {
            title: '数值精度',
            text: '',
            children: [
              '数值字段小数位数需根据具体场景决定，如：某产品零售中，库存和采购模块计重商品数量统计需精确至小数点后 3 位。',
            ],
          },
          {
            title: '正负号使用',
            text: '',
            children: [
              '一般情况正负号需同时使用。',
              {
                text: '在需要突出强调正值的业务中，可只使用“+”表示正值。',
                examples: [{ good: '+12.5°C', bad: '12.5°C' }],
              },
            ],
          },
          {
            title: '数值转换',
            text: '',
            children: [
              {
                text: '数值字段位数较多、显示较长时，可使用对应的中英文符号进行转换，如 1000 可写成 1K 或 1 千，10000 可写成 1W 或 1 万。',
                examples: [{ good: '1万', bad: '10000' }],
              },
              {
                text: '对数值精度要求不是特别准确时，可做丢失精度的转化，如：消费者端看到的商品销量为“411111”，可转换为“41 万”。',
                examples: [{ good: '411111 → 41万', bad: '411111' }],
              },
            ],
          },
          {
            title: '数值范围',
            text: '',
            children: [
              {
                text: '表达数值范围时，使用“-”进行连接，单位跟在第二个数值之后，如：400-500 件。',
                examples: [{ good: '400-500 件', bad: '400件-500件' }],
              },
            ],
          },
        ],
      },
      {
        id: 'phone-number',
        title: '通讯号码',
        rules: [
          {
            text: '手机号码推荐“3+4+4”格式显示，便于查看。',
            examples: [{ good: '135 2456 5865', bad: '13524565865' }],
          },
          {
            text: '座机号码区号使用括号“（）”，区号后的数字每 4 位使用空格分段。',
            examples: [{ good: '（0571）8688 5698', bad: '0571-86885698' }],
          },
        ],
      },
      {
        id: 'date-time',
        title: '日期与时间',
        description: '日期、星期、时刻组合时需统一格式。',
        rules: [
          {
            title: '需要“0”补齐',
            text: '',
            children: [
              {
                text: '日期使用分隔符时，日和月为个位数时需用“0”补齐。',
                examples: [{ good: '2018-02-02', bad: '2018-2-2' }],
              },
              {
                text: '日期或时间中带有分隔符“-”时，用“至”作为连接符表达范围与区间。',
                examples: [
                  { good: '2018-12-12 至 2018-12-14', bad: '2018-12-12 - 2018-12-14' },
                ],
              },
            ],
          },
          {
            title: '不需要“0”补齐',
            text: '',
            children: [
              {
                text: '日期不使用分隔符时，日和月为个位数时不用“0”补齐。',
                examples: [{ good: '2018年2月2日', bad: '2018年02月02日' }],
              },
              {
                text: '日期或时间中不带分隔符“-”时，用“-”作为连接符表达范围与区间。',
                examples: [
                  { good: '2018年12月12日 - 2018年12月14日', bad: '2018年12月12日 至 2018年12月14日' },
                ],
              },
            ],
          },
          {
            text: '年、月、日单独使用时，后面需带中文单位。',
            examples: [{ good: '2018年', bad: '2018Y' }],
          },
          {
            text: '日期、星期与时刻一起使用时，格式为“日期 时刻”或“日期 星期 时刻”。',
            examples: [
              { good: '2018-12-12 12:00:00', bad: '12:00:00 2018-12-12' },
              { good: '2018-12-12 周三 12:00:00', bad: '12:00:00 2018-12-12 周三' },
            ],
          },
          {
            text: '描述“周”的概念时，统一使用“周*”，如周一、周六、周日。',
            examples: [{ good: '周一', bad: '星期一' }],
          },
        ],
      },
      {
        id: 'masking',
        title: '数据脱敏规则',
        rules: [
          {
            title: '用户名、用户昵称脱敏规则',
            text: '',
            children: [
              {
                text: '字符数为 1-3 位时，脱敏后显示为 4 位字符，保留第 1 位字符，后 3 位字符使用“*”补充或替代。',
                examples: [{ good: '福 → 福***', bad: '福 → 福' }],
              },
              {
                text: '字符数大于 3 位时，脱敏后显示为 4 位字符，保留第 1 位和最后 1 位字符，其他字符使用“*”替换。',
                examples: [{ good: '福昕云服务 → 福**务', bad: '福昕云服务 → 福昕云服务' }],
              },
            ],
          },
          {
            title: '手机号码脱敏规则',
            text: '',
            children: [
              {
                text: '一般情况，隐藏手机号的第 4 位至第 7 位，共 4 位数字。',
                examples: [{ good: '135 **** 9865', bad: '135*****865' }],
              },
              {
                text: '手机号后 4 位可做验证或身份标识信息时，隐藏手机号的第 4 位至第 8 位，共 5 位数字。',
                examples: [{ good: '135 **** *865', bad: '135 2456 5865' }],
              },
            ],
          },
          {
            title: '电话号码脱敏规则',
            text: '',
            children: [
              {
                text: '电话号码由区号和号码组成，区号不脱敏，号码部分保留前 2 位和后 2 位。',
                examples: [{ good: '（055）54** *23', bad: '（055）5432 123' }],
              },
            ],
          },
          {
            title: '身份证号脱敏规则',
            text: '',
            children: [
              {
                text: '保留身份证号前 3 位与后 3 位。',
                examples: [{ good: '323************456', bad: '323822199012123456' }],
              },
            ],
          },
        ],
      },
      {
        id: 'special-usage',
        title: '特殊用法',
        rules: [
          {
            title: '版本号',
            text: '',
            children: [
              {
                text: '仅使用数字表示版本号即可，无需添加其他信息。',
                examples: [
                  {
                    good: '微商城 4.43.0 已上线\n当前版本为 4.43.0',
                    bad: '微商城 V4.43.0 已上线\n当前版本为 V4.43.0',
                  },
                ],
              },
            ],
          },
          {
            title: '功能路径',
            text: '',
            children: [
              {
                text: '功能路径用于表示产品功能点的导航路径，使用时用“-”间隔不同层级功能。',
                examples: [
                  {
                    good: '订单 - 交易查询 - 订单查询',
                    bad: '订单 > 交易查询 > 订单查询',
                  },
                ],
              },
            ],
          },
          {
            title: '包含序号的文本',
            text: '',
            children: [
              {
                text: '文本中包含序号时，序号使用“阿拉伯数字”加“.”表示。',
              },
              {
                text: '陈述点中如不包括句号，陈述点以分号结尾，最后一个陈述点以句号结尾。',
                examples: [
                  {
                    good: '1.文本信息；\n2.文本信息；\n3.文本信息。',
                    bad: '1：文本信息；\n2：文本信息；\n3：文本信息。',
                  },
                ],
              },
            ],
          },
          {
            title: '超链接文本',
            text: '',
            children: [
              {
                text: '超链接文本在句中时，即属于句子的一部分，在句中原有位置显示即可。',
                examples: [
                  {
                    good: '创建店铺代表同意《零售服务协议》。',
                    bad: '创建店铺代表同意。《零售服务协议》',
                    links: ['《零售服务协议》'],
                  },
                ],
              },
              {
                text: '超链接文本在句外时，在句尾加空格显示。',
                examples: [
                  {
                    good: '经营提醒：自营商品发布需审核通过方可上架销售。 查看详情',
                    bad: '经营提醒：自营商品发布需审核通过方可上架销售 查看详情。',
                    links: ['查看详情'],
                  },
                ],
              },
            ],
          },
          {
            title: '描述正在进行的状态或动作',
            text: '',
            children: [
              {
                text: '描述结构为“状态或动作 + 中…”。',
                examples: [{ good: '浏览量：加载中…', bad: '浏览量：正在加载' }],
              },
            ],
          },
          {
            title: '数据字段缺省',
            text: '',
            children: [
              {
                text: '当数据字段缺省、无法获取或为非法字段时，使用“-”替换原字段信息。',
                examples: [{ good: '浏览量：-', bad: '浏览量：--' }],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'vocab',
    number: '07',
    title: '常用词汇',
    shortTitle: '常用词汇',
    intro: '统一标准词汇、易混词汇和英文词汇的用法。',
    kind: 'lexicon',
    items: [],
    lexicons: [
      {
        id: 'standard-words',
        title: '标准词汇',
        description: '避免使用不推荐写法，按标准词统一表达。',
        headers: ['标准词汇', '不推荐用法', '使用场景/含义'],
        rows: [
          { id: 'login', columns: ['登录', '登陆', '-'] },
          {
            id: 'threshold',
            columns: ['阈值', '阀值', '“阈（yù）值”指一个效应能够产生的最低值或最高值。'],
          },
          {
            id: 'account',
            columns: ['账号', '帐号', '“帐”原指布、纱或绸子等做成的遮蔽物；“账”与钱财物有关，如支付宝、网易游戏和网银等使用账户。'],
          },
          { id: 'template', columns: ['模板', '模版', '-'] },
          { id: 'section', columns: ['版块', '板块', '-'] },
          { id: 'jd-e-card', columns: ['京东E卡', 'jd e卡', '-'] },
          { id: 'consumer-end', columns: ['消费者端', '买家端', '产品中，消费者使用的部分。'] },
          { id: 'merchant-end', columns: ['商家端', '卖家端', '产品中，商家使用的部分。'] },
          { id: 'you', columns: ['你', '您', '产品文案中优先使用“你”，与用户建立平等、直接的沟通方式。'] },
          { id: 'trade-success', columns: ['交易成功', '交易完成', '订单完成交易后的状态。'] },
          { id: 'trade-closed', columns: ['交易关闭', '交易失败', '交易不可继续或订单关闭后的状态。'] },
          { id: 'refund-end', columns: ['退款结束', '-', '-'] },
          { id: 'consignee', columns: ['收货人', '收件人', '订单收货环节的用户称谓。'] },
          { id: 'order-id', columns: ['订单编号', '订单号、订单号码', '电商订单的唯一编号。'] },
          { id: 'refund-id', columns: ['退款编号', '退款号、退款单号', '退款单据的唯一编号。'] },
          { id: 'city-delivery', columns: ['同城配送', '同城配、同城送', '城市范围内的商品配送服务。'] },
          { id: 'buyer-note', columns: ['买家留言', '买家备注', '买家在下单时填写的留言或备注信息。'] },
          { id: 'merchant-note', columns: ['商家备注', '商家留言', '商家在订单内填写的备注信息。'] },
        ],
      },
      {
        id: 'confusing-words',
        title: '易混词汇',
        description: '区分容易混用的词，按含义选择正确用法。',
        headers: ['词汇', '含义/用法'],
        rows: [
          { id: 'wait', columns: ['请稍候 / 请稍后', '请稍候：表示“请稍微等候”，后不接动作，如：数据加载中，请稍候。请稍后：表示“请稍微延后”，后接动作，如：请稍后重试。'] },
          { id: 'confirm', columns: ['确定 / 确认', '确定：使用时不需要跟随动作。确认：使用时需要跟随动作，如：确认删除。'] },
          { id: 'until', columns: ['截至 / 截止', '截至：强调“时间”，一般用在时间词语之前，如：截至周五。截止：强调“停止”，一般用在时间词语之后，如：已于周五截止；如需用在时间词语之前，加“到”作连接，如：截止到周五。'] },
          { id: 'delete', columns: ['删除 / 移除', '删除：永久性地去除操作对象，操作对象一般在系统中不再存在。移除：暂时性地去除操作对象，操作对象在当页不再显示，但仍存在于系统中。'] },
          { id: 'review', columns: ['审核 / 审批', '审核：审查核实，对材料的准确性进行必要核对。审批：审查并加以批示，通常指对下级单位上呈的报告或书面计划。'] },
          { id: 'account', columns: ['账号 / 账户', '账号：用于身份登录的标识。账户：用于资金、余额等的记录主体。'] },
          { id: 'category', columns: ['商品分类 / 商品分组', '商品分类：依据属性维度对商品进行归类。商品分组：商家自定义的陈列或运营分组。'] },
          { id: 'sku-code', columns: ['商品编码 / 商品条码', '商品编码：系统内用于标识商品的编号。商品条码：用于扫码识别的一维或二维码标识。'] },
          { id: 'refund-qty', columns: ['退款数量 / 退货数量', '退款数量：发生退款操作的商品数量。退货数量：发生退货操作的商品数量。'] },
          { id: 'service', columns: ['客服 / 客满', '客服：为客户提供咨询和售后支持的人员或通道。客满：用于表达“客户已满”“咨询已满员”等状态，不单独作为客服岗位名词。'] },
          { id: 'buyer', columns: ['买家 / 顾客 / 客户 / 用户 / 消费者', '电商产品中，优先按上下文区分使用买家、顾客、客户、用户、消费者，避免在同一界面混用。'] },
          { id: 'courier', columns: ['快递员 / 骑手', '快递员：配送快递包裹的配送人员。骑手：同城或外卖场景中的即时配送人员。'] },
          { id: 'refund-reason', columns: ['退款原因 / 退货原因', '退款原因：申请退款时选择或填写的原因。退货原因：申请退货时选择或填写的原因。'] },
          { id: 'total', columns: ['累计 / 累积', '累计：多次加总的结果或总和。累积：逐次积存、聚集的过程。'] },
          { id: 'enable', columns: ['应用 / 启用', '应用：把规则、设置运用到一个对象上。启用：让某项功能进入可使用状态。'] },
          { id: 'create', columns: ['新建 / 添加', '新建：创建一个新对象，如图书签、订单、商家。添加：在已有对象上补充内容，如添加商品、添加联系人。'] },
        ],
        tables: [
          {
            title: '请稍候 / 请稍后',
            headers: ['词汇', '含义/用法'],
            rows: [
              { id: 'wait-1', columns: ['请稍候', '表示“请稍微等待”，后不接动作，如：数据正在加载，请稍候。'] },
              { id: 'wait-2', columns: ['请稍后', '表示“请稍微延后”，后接动作，如：请稍后重试。'] },
            ],
          },
          {
            title: '确定 / 确认',
            headers: ['词汇', '含义/用法'],
            rows: [
              { id: 'confirm-1', columns: ['确定', '表示认可、肯定，使用时不需要跟随动作。'] },
              { id: 'confirm-2', columns: ['确认', '表示对结果进行核对/确认，使用时一般跟随动作，如：确认删除。'] },
            ],
          },
          {
            title: '截至 / 截止',
            headers: ['词汇', '含义/用法'],
            rows: [
              { id: 'until-1', columns: ['截至', '强调“时间”，一般用在时间词语之前，如：截至周五。'] },
              { id: 'until-2', columns: ['截止', '强调“停止”，一般用在时间词语之后，如：已于周五截止；如需用在时间词语之前，加“到”作连接，如：截止到周五。'] },
            ],
          },
          {
            title: '删除 / 移除',
            headers: ['词汇', '含义/用法'],
            rows: [
              { id: 'delete-1', columns: ['删除', '永久性地去除操作对象，操作对象一般在系统中不再存在。'] },
              { id: 'delete-2', columns: ['移除', '暂时性地去除操作对象，操作对象在当页不再显示，但仍存在于系统中。'] },
            ],
          },
          {
            title: '审核 / 审批',
            headers: ['词汇', '含义/用法'],
            rows: [
              { id: 'review-1', columns: ['审核', '审查核实，对内容的准确性进行必要核对。'] },
              { id: 'review-2', columns: ['审批', '审查并加以批示，通常指对报告或书面计划进行审查批示。'] },
            ],
          },
          {
            title: '账号 / 账户',
            headers: ['词汇', '含义/用法'],
            rows: [
              { id: 'account-1', columns: ['账号', '用于身份登录的用户标识。'] },
              { id: 'account-2', columns: ['账户', '用于资金、余额等表述的记录主体。'] },
            ],
          },
          {
            title: '商品分类 / 商品分组',
            headers: ['词汇', '含义/用法'],
            rows: [
              { id: 'category-1', columns: ['商品分类', '依据属性维度对商品进行归类的结果。'] },
              { id: 'category-2', columns: ['商品分组', '商家自定义的陈列或运营分组。'] },
            ],
          },
          {
            title: '商品编码 / 商品条码',
            headers: ['词汇', '含义/用法'],
            rows: [
              { id: 'sku-code-1', columns: ['商品编码', '系统内用于标识商品的编号。'] },
              { id: 'sku-code-2', columns: ['商品条码', '用于扫码识别的一维或二维码标识。'] },
            ],
          },
          {
            title: '退款数量 / 退货数量',
            headers: ['词汇', '含义/用法'],
            rows: [
              { id: 'refund-qty-1', columns: ['退款数量', '发生退款操作的商品数量。'] },
              { id: 'refund-qty-2', columns: ['退货数量', '发生退货操作的商品数量。'] },
            ],
          },
          {
            title: '客服 / 客满',
            headers: ['词汇', '含义/用法'],
            rows: [
              { id: 'service-1', columns: ['客服', '为客户提供咨询和售后支持的人员或通道。'] },
              { id: 'service-2', columns: ['客满', '用于表达“客户已满”“咨询已满员”等状态，不单独作为客服岗位名词。'] },
            ],
          },
          {
            title: '买家 / 顾客',
            headers: ['词汇', '含义/用法'],
            rows: [
              { id: 'buyer-customer-1', columns: ['买家', '在电商平台下单购买商品的用户。'] },
              { id: 'buyer-customer-2', columns: ['顾客', '接受商品或服务的对象，适用于门店或客服场景。'] },
            ],
          },
          {
            title: '客户 / 用户',
            headers: ['词汇', '含义/用法'],
            rows: [
              { id: 'client-1', columns: ['客户', '与商家产生商业服务关系的对象。'] },
              { id: 'client-2', columns: ['用户', '使用产品功能的主体。'] },
            ],
          },
          {
            title: '消费者 / 用户',
            headers: ['词汇', '含义/用法'],
            rows: [
              { id: 'consumer-user-1', columns: ['消费者', '购买并使用商品或服务的自然人。'] },
              { id: 'consumer-user-2', columns: ['用户', '使用产品功能的主体；与消费者并存时需先统一用法，避免同界面混用。'] },
            ],
          },
          {
            title: '快递员 / 骑手',
            headers: ['词汇', '含义/用法'],
            rows: [
              { id: 'courier-1', columns: ['快递员', '配送快递包裹的配送人员。'] },
              { id: 'courier-2', columns: ['骑手', '同城或外卖场景中的即时配送人员。'] },
            ],
          },
          {
            title: '退款原因 / 退货原因',
            headers: ['词汇', '含义/用法'],
            rows: [
              { id: 'refund-reason-1', columns: ['退款原因', '申请退款时选择或填写的原因。'] },
              { id: 'refund-reason-2', columns: ['退货原因', '申请退货时选择或填写的原因。'] },
            ],
          },
          {
            title: '累计 / 累积',
            headers: ['词汇', '含义/用法'],
            rows: [
              { id: 'total-1', columns: ['累计', '多次加总的结果或总和。'] },
              { id: 'total-2', columns: ['累积', '逐次积存、聚集的过程。'] },
            ],
          },
          {
            title: '应用 / 启用',
            headers: ['词汇', '含义/用法'],
            rows: [
              { id: 'enable-1', columns: ['应用', '把规则、设置运用到一个对象上。'] },
              { id: 'enable-2', columns: ['启用', '让某项功能进入可使用状态。'] },
            ],
          },
          {
            title: '新建 / 添加',
            headers: ['词汇', '含义/用法'],
            rows: [
              { id: 'create-1', columns: ['新建', '创建一个新的对象，如新建订单、新建商家。'] },
              { id: 'create-2', columns: ['添加', '在已有对象上补充内容，如添加商品、添加联系人。'] },
            ],
          },
        ],
      },
      {
        id: 'english-words',
        title: '英文词汇',
        description: '统一常见英文缩写和产品词汇的用法。',
        headers: ['标准词汇', '词汇释义'],
        rows: [
          { id: 'ios', columns: ['iOS', '苹果公司开发的移动操作系统。'] },
          { id: 'android', columns: ['Android', '安卓。'] },
          { id: 'pc', columns: ['PC', '个人电脑。'] },
          { id: 'web', columns: ['Web', '网页。'] },
          { id: 'pad', columns: ['Pad', '平板设备，如苹果公司的“iPad”。'] },
          { id: 'phone', columns: ['Phone', '手机，如苹果公司的“iPhone”。'] },
          { id: 'app', columns: ['App', 'Application（应用程序）的缩写。'] },
          { id: 'saas', columns: ['SaaS', 'Software-as-a-Service（软件即服务）的缩写。'] },
          { id: 'bbs', columns: ['BBS', 'Bulletin Board System（电子公告牌系统）的缩写。'] },
          { id: 'pos', columns: ['POS', 'Point of Sale（销售终端）的缩写。'] },
          { id: 'erp', columns: ['ERP', 'Enterprise Resource Planning（企业资源计划）的缩写。'] },
          { id: 'vip', columns: ['VIP', 'Very Important Person（重要客户）的缩写。'] },
          { id: 'sku', columns: ['SKU', 'Stock Keeping Unit（库存量单位）的缩写，用于标识商品。'] },
          { id: 'spu', columns: ['SPU', 'Standard Product Unit（标准产品单位）的缩写，用于聚合同一商品的不同销售属性。'] },
        ],
      },
    ],
  },
]
