import PinyinUtil from './pinyinUtil'
import { word_val } from '../../../store';
/**
 * 
 * input-method.js
 */
// import px2rem from 'px2rem'
export class SimpleInputMethod {
	hanzi: string = ''; // 候选汉字
	pinyin: string = ''; // 候选拼音
	result: [] = []; // 当前匹配到的汉字集合
	pageCurrent: number = 1; // 当前页
	pageSize: number = 6; // 每页大小
	pageCount: number = 0; // 总页数
	_target: any;
	_pinyinTarget: any;
	_resultTarget: any;
	_input: any;
	pinyinUtil = new PinyinUtil();


// constructor(hanzi: string,pinyin: string,result: [],pageCurrent: number,pageSize: number,pageCount: number) {
// 	this.hanzi = hanzi;
// 	this.pinyin = pinyin;
// 	this.result = result;
// 	this.pageCurrent = pageCurrent;
// 	this.pageSize = pageSize;
// 	this.pageCount = pageCount;
// }
//  SimpleInputMethod = {
	// hanzi: '', // 候选汉字
	// pinyin: '', // 候选拼音
	// result: [], // 当前匹配到的汉字集合
	// pageCurrent: 1, // 当前页
	// pageSize: 6, // 每页大小
	// pageCount: 0, // 总页数
	/**
	 * 初始化字典配置
	 */
	// initDict: function()
	initDict(): void {
		var dict = this.pinyinUtil.dict;
		this.pinyinUtil.parseDict();
		if(!dict.py2hz) throw '未找到合适的字典文件！';
		// 这一步仅仅是给字母a-z扩充，例如根据b找不到相关汉字，就把bi的结果赋值给b
		// 当然这种方式只是很简单的实现，真正的拼音输入法肯定不能这么简单处理
		dict.py2hz2 = {};
		dict.py2hz2['i'] = 'i'; // i比较特殊，没有符合的汉字，所以特殊处理
		for(var i=97; i<=123; i++)
		{
			var ch = String.fromCharCode(i);
			if(!dict.py2hz[ch])
			{
				for(var j in dict.py2hz)
				{
					if(j.indexOf(ch) == 0)
					{
						dict.py2hz2[ch] = dict.py2hz[j];
						break;
					}
				}
			}
		}
	}
	/**
	 * 初始化DOM结构
	 */
	// initDom: function()
	initDom(): void{
		var temp = '<div class="pinyin"></div><div class="result"><ol></ol><div class="page-up-down"><span class="page-up">▲</span><span class="page-down">▼</span></div></div>';
		var dom = document.createElement('div');
		dom.id = 'simle_input_method';
		dom.className = 'simple-input-method';
		dom.innerHTML = temp;
		var that = this;
		// 初始化汉字选择和翻页键的点击事件
		dom.addEventListener('click', function(e: any)
		{
			var target = e.target;
			if(target.nodeName == 'LI') that.selectHanzi(parseInt(target.dataset.idx));
			else if(target.nodeName == 'SPAN')
			{
				if(target.className == 'page-up' && that.pageCurrent > 1)
				{
					that.pageCurrent--;
					that.refreshPage();
				}
				else if(target.className == 'page-down' && that.pageCurrent < that.pageCount)
				{
					that.pageCurrent++;
					that.refreshPage();
				}
			}
		})
		document.getElementById('keyboard')!.appendChild(dom);
	}
	/**
	 * 初始化
	 */
	init(selector: any){
		this.initDict();
		this.initDom();
		var obj = document.querySelectorAll(selector);
		this._target = document.querySelector('#simle_input_method');
		this._pinyinTarget = document.querySelector('#simle_input_method .pinyin');
		this._resultTarget = document.querySelector('#simle_input_method .result ol');
		var that = this;
		for(var i=0; i<obj.length; i++)
		{
			obj[i].addEventListener('keydown', function(e: any)
			{
				var keyCode = e.keyCode;
				// console.log(keyCode,'keyCode')
				var preventDefault = false;
				if(keyCode >= 65 && keyCode <= 90) // A-Z
				{
					that.addChar(String.fromCharCode(keyCode+32), that);
					preventDefault = true;
				}
				else if(keyCode == 8 && that.pinyin) // 删除键
				{
					that.delChar();
					preventDefault = true;
				}
				else if(keyCode >= 48 && keyCode <= 57 && !e.shiftKey && that.pinyin) // 1-9
				{
					that.selectHanzi(keyCode-48);
					preventDefault = true;
				}
				else if(keyCode == 32 && that.pinyin) // 空格
				{
					that.selectHanzi(1);
					preventDefault = true;
				}
				else if(keyCode == 33 && that.pageCount > 0 && that.pageCurrent > 1) // 上翻页
				{
					that.pageCurrent--;
					that.refreshPage();
					preventDefault = true;
				}
				else if(keyCode == 34 && that.pageCount > 0 && that.pageCurrent < that.pageCount) // 下翻页
				{
					that.pageCurrent++;
					that.refreshPage();
					preventDefault = true;
				}
				if(preventDefault) e.preventDefault();
			});
			obj[i].addEventListener('focus', function()
			{
				// 如果选中的不是当前文本框，隐藏输入法
				if(that._input !== that) that.hide();
			});
		}
	}
	// 虚拟键盘点击事件
	receiveKeyCode(keyCode: any) {

		var that = this;
		// var keyCode = e.keyCode;
		var preventDefault = false;
		if(keyCode >= 65 && keyCode <= 90) // A-Z
		{
			that.addChar(String.fromCharCode(keyCode+32), this);
			preventDefault = true;
		}
		else if(keyCode == 8 && that.pinyin) // 删除键
		{
			that.delChar();
			preventDefault = true;
		}
		// else if(keyCode >= 48 && keyCode <= 57 && !e.shiftKey && that.pinyin) // 1-9
		else if(keyCode >= 48 && keyCode <= 57 && that.pinyin) // 1-9
		{
			that.selectHanzi(keyCode-48);
			preventDefault = true;
		}
		else if(keyCode == 32 && that.pinyin) // 空格
		{
			that.selectHanzi(1);
			preventDefault = true;
		}
		else if(keyCode == 33 && that.pageCount > 0 && that.pageCurrent > 1) // 上翻页
		{
			that.pageCurrent--;
			that.refreshPage();
			preventDefault = true;
		}
		else if(keyCode == 34 && that.pageCount > 0 && that.pageCurrent < that.pageCount) // 下翻页
		{
			that.pageCurrent++;
			that.refreshPage();
			preventDefault = true;
		}
		
	}
	/**
	 * 单个拼音转单个汉字，例如输入 "a" 返回 "阿啊呵腌嗄吖锕"
	 */
	getSingleHanzi(pinyin: any)
	{
		return this.pinyinUtil.dict.py2hz2[pinyin] || this.pinyinUtil.dict.py2hz[pinyin] || '';
	}
	/**
	 * 拼音转汉字
	 * @param pinyin 需要转换的拼音，如 zhongguo
	 * @return 返回一个数组，格式类似：[["中","重","种","众","终","钟","忠"], "zhong'guo"]
	 */
	getHanzi(pinyin: any)
	{
		var result = this.getSingleHanzi(pinyin);
		if(result) return [result.split(''), pinyin];
		var temp = '';
		for(var i=0, len = pinyin.length; i<len; i++)
		{
			temp += pinyin[i];
			result = this.getSingleHanzi(temp);
			if(!result) continue;
			// flag表示如果当前能匹配到结果、并且往后5个字母不能匹配结果，因为最长可能是5个字母，如 zhuang
			var flag = false;
			if((i+1) < pinyin.length)
			{
				for(var j=1, lens = pinyin.length; j<=6 && (i+j)<lens; j++)
				{
					if(this.getSingleHanzi(pinyin.substr(0, i+j+1)))
					{
						flag = true;
						break;
					}
				}
			}
			if(!flag) return [result.split(''), pinyin.substr(0, i+1) + "'" + pinyin.substr(i+1)];
		}
		return [[], '']; // 理论上一般不会出现这种情况
	}
	/**
	 * 选择某个汉字，i有效值为1-5
	 */
	// selectHanzi: function(i)
	selectHanzi(i: any): void {
		var hz = this.result[(this.pageCurrent - 1) * this.pageSize + i - 1];
		if(!hz) return;
		this.hanzi += hz;
		var idx = this.pinyin.indexOf("'");
		let that = this;
		if(idx > 0)
		{
			this.pinyin = this.pinyin.substr(idx+1);
			this.refresh();
		}
		else // 如果没有单引号，表示已经没有候选词了
		{
			// this._input.value += this.hanzi;
			word_val.update((n:string)=> n = this.hanzi);
      // dispatch('keyboardVal', this.hanzi)
			this.hide();
		}
	}
	/**
	 * 将拼音转换成汉字候选词，并显示在界面上
	 */
	refresh()
	{
		var temp = this.getHanzi(this.pinyin.replace(/'/g, ''));
		this.result = temp[0];
		this.pinyin = temp[1];
		var count = this.result.length;
		this.pageCurrent = 1;
		this.pageCount = Math.ceil(count / this.pageSize);
		this._pinyinTarget.innerHTML = this.hanzi + this.pinyin;
		this.refreshPage();
	}
	refreshPage()
	{
		var temp = this.result.slice((this.pageCurrent-1)*this.pageSize, this.pageCurrent*this.pageSize);
		var html = '';
		var i = 0;
		temp.forEach(function(val)
		{
			html += '<li data-idx="'+(++i)+'">' + val + '</li>';
		});
		this._target.querySelector('.page-up').style.opacity = this.pageCurrent > 1 ? '1' : '.3';
		this._target.querySelector('.page-down').style.opacity = this.pageCurrent < this.pageCount ? '1' : '.3';
		this._resultTarget.innerHTML = html;
	}
	addChar(ch: any, obj: any)
	{
		if(this.pinyin.length == 0) // 长度为1，显示输入法
		{
			this.show(obj);
		}
		this.pinyin += ch;
		this.refresh();
	}
	delChar()
	{
		if(this.pinyin.length <= 1)
		{
			this.hide();
			return;
		}
		this.pinyin = this.pinyin.substr(0, this.pinyin.length-1);
		this.refresh();
	}
	show(obj: any)
	{
		var el = document.querySelectorAll('.test-input-method')[0];
		var pos = el.getBoundingClientRect();
		// var pos = obj.getBoundingClientRect();
		// console.log(pos.top,pos.bottom,pos.left,pos.right,pos.width, pos.height)
		// 80是输入法的大约高度，为了不遮挡键盘
		if(pos.left===0) {
			this._target.style.left = '5%';
			this._target.style.bottom = document.getElementById('keyboard')?.offsetHeight+'px';
		} else {
			this._target.style.left = '5%';
			this._target.style.bottom = (320/1340*100)+'rem';
		}
		this._target.style.display = 'block';
	}
	hide()
	{
		this.reset();
		this._target.style.display = 'none';
	}
	reset()
	{
		this.hanzi = '';
		this.pinyin = '';
		this.result = [];
		this.pageCurrent = 1;
		this.pageCount = 0;
		this._pinyinTarget.innerHTML = '';
	}
// };
}
// window.SimpleInputMethod = SimpleInputMethod;
// module.export = {
// 	SimpleInputMethod
// } 