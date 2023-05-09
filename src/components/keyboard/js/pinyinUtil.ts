import pinyin_dict_notone from './pinyin_dict_notone'
/**
 * 汉字与拼音互转工具，根据导入的字典文件的不同支持不同
 * 对于多音字目前只是将所有可能的组合输出，准确识别多音字需要完善的词库，而词库文件往往比字库还要大，所以不太适合web环境。
 */
;(function(global: any, factory:any) {
	if (typeof module === "object" && typeof module.exports === "object") {
		module.exports = factory(global);
	} else {
		factory(global);
	}
})
// let pinyinUtil = (typeof window !== "undefined" ? window : this, function(window) {
class pinyinUtil  {

	toneMap: any = {
		"ā": "a1",
		"á": "a2",
		"ǎ": "a3",
		"à": "a4",
		"ō": "o1",
		"ó": "o2",
		"ǒ": "o3",
		"ò": "o4",
		"ē": "e1",
		"é": "e2",
		"ě": "e3",
		"è": "e4",
		"ī": "i1",
		"í": "i2",
		"ǐ": "i3",
		"ì": "i4",
		"ū": "u1",
		"ú": "u2",
		"ǔ": "u3",
		"ù": "u4",
		"ü": "v0",
		"ǖ": "v1",
		"ǘ": "v2",
		"ǚ": "v3",
		"ǜ": "v4",
		"ń": "n2",
		"ň": "n3",
		"": "m2"
	};

	 dict: any = {}; // 存储所有字典数据
	//  pinyinUtil ={
		/**
		 * 解析各种字典文件，所需的字典文件必须在本JS之前导入
		 */
		parseDict(){
			// 如果导入了 pinyin_dict_notone.js
			if(pinyin_dict_notone)
			{
				this.dict.notone = {};
				this.dict.py2hz = pinyin_dict_notone; // 拼音转汉字
				for(var i in pinyin_dict_notone)
				{
					var temp = pinyin_dict_notone[i];
					for(var j=0, len=temp.length; j<len; j++)
					{
						if(!this.dict.notone[temp[j]]) this.dict.notone[temp[j]] = i; // 不考虑多音字
					}
				}
			}
		}
		/**
		 * 根据汉字获取拼音，如果不是汉字直接返回原字符
		 * @param chinese 要转换的汉字
		 * @param splitter 分隔字符，默认用空格分隔
		 * @param withtone 返回结果是否包含声调，默认是
		 * @param polyphone 是否支持多音字，默认否
		 */
		getPinyin(chinese:any, splitter:any, withtone:any, polyphone:any)
		{
			if(!chinese || /^ +$/g.test(chinese)) return '';
			splitter = splitter == undefined ? ' ' : splitter;
			withtone = withtone == undefined ? true : withtone;
			polyphone = polyphone == undefined ? false : polyphone;
			var result = [];
			if(this.dict.withtone) // 优先使用带声调的字典文件
			{
				var noChinese = '';
				for (var i=0, len = chinese.length; i < len; i++)
				{
					var pinyin = this.dict.withtone[chinese[i]];
					if(pinyin)
					{
						// 如果不需要多音字，默认返回第一个拼音，后面的直接忽略
						// 所以这对数据字典有一定要求，常见字的拼音必须放在最前面
						if(!polyphone) pinyin = pinyin.replace(/ .*$/g, '');
						if(!withtone) pinyin = this.removeTone(pinyin); // 如果不需要声调
						//空格，把noChinese作为一个词插入
						noChinese && ( result.push( noChinese), noChinese = '' );
						result.push( pinyin ); 
					}
					else if ( !chinese[i] || /^ +$/g.test(chinese[i]) ){
						//空格，把noChinese作为一个词插入
						noChinese && ( result.push( noChinese), noChinese = '' );
					}
					else{
						noChinese += chinese[i];
					}
				}
				if ( noChinese ){
					result.push( noChinese);
					noChinese = '';
				}
			}
			else if(this.dict.notone) // 使用没有声调的字典文件
			{
				if(withtone) console.warn('pinyin_dict_notone 字典文件不支持声调！');
				if(polyphone) console.warn('pinyin_dict_notone 字典文件不支持多音字！');
				var noChinese = '';
				for (var i=0, len = chinese.length; i < len; i++)
				{
					var temp = chinese.charAt(i),
						pinyin = this.dict.notone[temp];
					if ( pinyin ){ //插入拼音
						//空格，把noChinese作为一个词插入
						noChinese && ( result.push( noChinese), noChinese = '' );
						result.push( pinyin );
					}
					else if ( !temp || /^ +$/g.test(temp) ){
						//空格，插入之前的非中文字符
						noChinese && ( result.push( noChinese), noChinese = '' );
					}
					else {
						//非空格，关联到noChinese中
						noChinese += temp;
					}
				}

				if ( noChinese ){
					result.push( noChinese );
					noChinese = '';
				}
			}
			else
			{
				throw '抱歉，未找到合适的拼音字典文件！';
			}
			if(!polyphone) return result.join(splitter);
			else
			{
				// if(pinyin_dict_polyphone) return this.parsePolyphone(chinese, result, splitter, withtone);
				// else 
				return this.handlePolyphone(result, ' ', splitter);
			}
		}
		/**
		 * 获取汉字的拼音首字母
		 * @param str 汉字字符串，如果遇到非汉字则原样返回
		 * @param polyphone 是否支持多音字，默认false，如果为true，会返回所有可能的组合数组
		 */
		getFirstLetter(str:any, polyphone:any)
		{
			polyphone = polyphone == undefined ? false : polyphone;
			if(!str || /^ +$/g.test(str)) return '';
			if(this.dict.firstletter) // 使用首字母字典文件
			{
				var result = [];
				for(var i=0; i<str.length; i++)
				{
					var unicode = str.charCodeAt(i);
					var ch = str.charAt(i);
					if(unicode >= 19968 && unicode <= 40869)
					{
						ch = this.dict.firstletter.all.charAt(unicode-19968);
						if(polyphone) ch = this.dict.firstletter.polyphone[unicode] || ch;
					}
					result.push(ch);
				}
				if(!polyphone) return result.join(''); // 如果不用管多音字，直接将数组拼接成字符串
				else return this.handlePolyphone(result, '', ''); // 处理多音字，此时的result类似于：['D', 'ZC', 'F']
			}
			else
			{
				var py = this.getPinyin(str, ' ', false, polyphone);
				py = py instanceof Array ? py : [py];
				var result = [];
				for(var i=0; i<py.length; i++)
				{
					result.push(py[i].replace(/(^| )(\w)\w*/g, function(m:any,$1:any,$2:any){return $2.toUpperCase();}));
				}
				if(!polyphone) return result[0];
				else return this.simpleUnique(result);
			}
		}
		/**
		 * 拼音转汉字，只支持单个汉字，返回所有匹配的汉字组合
		 * @param pinyin 单个汉字的拼音，可以包含声调
		 */
		getHanzi(pinyin:any)
		{
			if(!this.dict.py2hz)
			{
				throw '抱歉，未找到合适的拼音字典文件！';
			}
			return this.dict.py2hz[this.removeTone(pinyin)] || '';
		}
		/**
		 * 去除拼音中的声调，比如将 xiǎo míng tóng xué 转换成 xiao ming tong xue
		 * @param pinyin 需要转换的拼音
		 */
		removeTone(pinyin:any)
		{
			let that = this;
			return pinyin.replace(/[āáǎàōóǒòēéěèīíǐìūúǔùüǖǘǚǜńň]/g, function(m:any){ return that.toneMap[m][0]; });
		}
	/**
	 * 处理多音字，将类似['D', 'ZC', 'F']转换成['DZF', 'DCF']
	 * 或者将 ['chang zhang', 'cheng'] 转换成 ['chang cheng', 'zhang cheng']
	 */
	 handlePolyphone(array:any, splitter:any, joinChar:any)
	{
		splitter = splitter || '';
		var result = [''], temp = [];
		for(var i=0; i<array.length; i++)
		{
			temp = [];
			var t = array[i].split(splitter);
			for(var j=0; j<t.length; j++)
			{
				for(var k=0; k<result.length; k++)
					temp.push(result[k] + (result[k]?joinChar:'') + t[j]);
			}
			result = temp;
		}
		return this.simpleUnique(result);
	}

	// 简单数组去重
	 simpleUnique(array:any)
	{
		var result = [];
		var hash: any = {};
		for(var i=0; i<array.length; i++)
		{
			var key = (typeof array[i]) + array[i];
			if(!hash[key])
			{
				result.push(array[i]);
				hash[key] = true;
			}
		}
		return result;
	}

};
export default pinyinUtil