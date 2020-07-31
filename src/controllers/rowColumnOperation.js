
import pivotTable from './pivotTable';
import luckysheetPostil from './postil';
import menuButton from './menuButton';
import server from './server';
import { selectHightlightShow, luckysheet_count_show } from './select';
import { 
    getObjType, 
    showrightclickmenu, 
} from '../utils/util';
import { getSheetIndex, getRangetxt } from '../methods/get';
import { 
    rowLocation, 
    rowLocationByIndex, 
    colLocation, 
    colLocationByIndex, 
    mouseposition 
} from '../global/location';
import { isRealNull, isRealNum, hasPartMC, isEditMode } from '../global/validate';
import { countfunc } from '../global/count';
import formula from '../global/formula';
import { luckysheetextendtable, luckysheetdeletetable } from '../global/extend';
import { 
    jfrefreshgrid, 
    jfrefreshgridall, 
    jfrefreshgrid_rhcw,
} from '../global/refresh';
import { getcellvalue } from '../global/getdata';
import tooltip from '../global/tooltip';
import editor from '../global/editor';
import locale from '../locale/locale';
import Store from '../store';



export function rowColumnOperationInitial(){


            //表格行标题 mouse事件
    $("#luckysheet-rows-h").mousedown(function (event) {
        //有批注在编辑时
        luckysheetPostil.removeActivePs();

        let mouse = mouseposition(event.pageX, event.pageY);
        let y = mouse[1] + $("#luckysheet-rows-h").scrollTop();

        let row_location = rowLocation(y), 
            row = row_location[1], 
            row_pre = row_location[0], 
            row_index = row_location[2];
        let col_index = Store.visibledatacolumn.length - 1, 
            col = Store.visibledatacolumn[col_index], col_pre = 0;

        $("#luckysheet-rightclick-menu").hide();
        $("#luckysheet-sheet-list, #luckysheet-rightclick-sheet-menu").hide();

        //mousedown是右键
        if (event.which == "3") {
            let isright = false;

            for(let s = 0; s < Store.luckysheet_select_save.length; s++){
                let obj_s = Store.luckysheet_select_save[s];

                if(obj_s["row"] != null && (row_index >= obj_s["row"][0] && row_index <= obj_s["row"][1]) && (obj_s["column"][0] == 0 && obj_s["column"][1] == Store.flowdata[0].length - 1)){
                    isright = true;
                    break;
                }
            }

            if(isright){
                return;
            }
        }

        let top = row_pre, height = row - row_pre - 1;
        let rowseleted = [row_index, row_index];

        Store.luckysheet_scroll_status = true;

        //公式相关
        let $input = $("#luckysheet-input-box");
        if (parseInt($input.css("top")) > 0) {
            if (formula.rangestart || formula.rangedrag_column_start || formula.rangedrag_row_start || formula.israngeseleciton() || $("#luckysheet-ifFormulaGenerator-multiRange-dialog").is(":visible")) {
                //公式选区
                let changeparam = menuButton.mergeMoveMain([0, col_index], rowseleted, {"row_focus": row_index, "column_focus": 0}, top, height, col_pre, col);
                if(changeparam != null){
                    //columnseleted = changeparam[0];
                    rowseleted = changeparam[1];
                    top = changeparam[2];
                    height = changeparam[3];
                    //left = changeparam[4];
                    //width = changeparam[5];
                }

                if(event.shiftKey){
                    let last = formula.func_selectedrange;

                    let top = 0, height = 0, rowseleted = [];
                    if (last.top > row_pre) {
                        top = row_pre;
                        height = last.top + last.height - row_pre;

                        if(last.row[1] > last.row_focus){
                            last.row[1] = last.row_focus;
                        }

                        rowseleted = [row_index, last.row[1]];
                    }
                    else if (last.top == row_pre) {
                        top = row_pre;
                        height = last.top + last.height - row_pre;
                        rowseleted = [row_index, last.row[0]];
                    }
                    else {
                        top = last.top;
                        height = row - last.top - 1;

                        if(last.row[0] < last.row_focus){
                            last.row[0] = last.row_focus;
                        }

                        rowseleted = [last.row[0], row_index];
                    }

                    let changeparam = menuButton.mergeMoveMain([0, col_index], rowseleted, {"row_focus": row_index, "column_focus": 0}, top, height, col_pre, col);
                    if(changeparam != null){
                        // columnseleted = changeparam[0];
                        rowseleted = changeparam[1];
                        top = changeparam[2];
                        height = changeparam[3];
                        // left = changeparam[4];
                        // width = changeparam[5];
                    }

                    last["row"] = rowseleted;

                    last["top_move"] = top;
                    last["height_move"] = height;

                    formula.func_selectedrange = last;
                }
                else if(event.ctrlKey && $("#luckysheet-rich-text-editor").find("span").last().text() != ","){
                    //按住ctrl 选择选区时  先处理上一个选区
                    let vText = $("#luckysheet-rich-text-editor").text() + ",";
                    if(vText.length > 0 && vText.substr(0, 1) == "="){
                        vText = formula.functionHTMLGenerate(vText);

                        if (window.getSelection) { // all browsers, except IE before version 9
                            let currSelection = window.getSelection();
                            formula.functionRangeIndex = [$(currSelection.anchorNode).parent().index(), currSelection.anchorOffset];
                        } 
                        else { // Internet Explorer before version 9
                            let textRange = document.selection.createRange();
                            formula.functionRangeIndex = textRange;
                        }

                        $("#luckysheet-rich-text-editor").html(vText);

                        formula.canceFunctionrangeSelected();
                        formula.createRangeHightlight();
                    }

                    formula.rangestart = false;
                    formula.rangedrag_column_start = false;
                    formula.rangedrag_row_start = false;

                    $("#luckysheet-functionbox-cell").html(vText);
                    formula.rangeHightlightselected($("#luckysheet-rich-text-editor"));

                    //再进行 选区的选择
                    formula.israngeseleciton();
                    formula.func_selectedrange = {
                        "left": colLocationByIndex(0)[0],
                        "width": colLocationByIndex(0)[1] - colLocationByIndex(0)[0] - 1,
                        "top": top,
                        "height": height,
                        "left_move": col_pre, 
                        "width_move": col - col_pre - 1, 
                        "top_move": top, 
                        "height_move": height, 
                        "row": rowseleted, 
                        "column": [0, col_index], 
                        "row_focus": row_index, 
                        "column_focus": 0
                    }
                }
                else{
                    formula.func_selectedrange = {
                        "left": colLocationByIndex(0)[0],
                        "width": colLocationByIndex(0)[1] - colLocationByIndex(0)[0] - 1,
                        "top": top,
                        "height": height,
                        "left_move": col_pre, 
                        "width_move": col - col_pre - 1, 
                        "top_move": top, 
                        "height_move": height, 
                        "row": rowseleted, 
                        "column": [0, col_index], 
                        "row_focus": row_index, 
                        "column_focus": 0
                    }
                }

                if(formula.rangestart || formula.rangedrag_column_start || formula.rangedrag_row_start || formula.israngeseleciton()){
                    formula.rangeSetValue({ "row": rowseleted, "column": [null, null] });
                }
                else if($("#luckysheet-ifFormulaGenerator-multiRange-dialog").is(":visible")){//if公式生成器
                    let range = getRangetxt(Store.currentSheetIndex, { "row": rowseleted, "column": [0, col_index] }, Store.currentSheetIndex);
                    $("#luckysheet-ifFormulaGenerator-multiRange-dialog input").val(range);
                }

                formula.rangedrag_row_start = true;
                formula.rangestart = false;
                formula.rangedrag_column_start = false;

                $("#luckysheet-formula-functionrange-select").css({ 
                    "left": col_pre, 
                    "width": col - col_pre - 1, 
                    "top": top, 
                    "height": height 
                }).show();
                $("#luckysheet-formula-help-c").hide();

                luckysheet_count_show(col_pre, top, col - col_pre - 1, height, rowseleted, [0, col_index]);

                setTimeout(function(){
                    let currSelection = window.getSelection();
                    let anchorOffset = currSelection.anchorNode;
                    
                    let $editor;
                    if($("#luckysheet-search-formula-parm").is(":visible")||$("#luckysheet-search-formula-parm-select").is(":visible")){
                        $editor = $("#luckysheet-rich-text-editor");
                        formula.rangechangeindex = formula.data_parm_index;
                    }
                    else{
                        $editor = $(anchorOffset).closest("div");
                    }

                    let $span = $editor.find("span[rangeindex='" + formula.rangechangeindex + "']");

                    formula.setCaretPosition($span.get(0), 0, $span.html().length);
                }, 1);

                return;
            }
            else {
                formula.updatecell(Store.luckysheetCellUpdate[0], Store.luckysheetCellUpdate[1]);
                Store.luckysheet_rows_selected_status = true;
            }
        }
        else {
            Store.luckysheet_rows_selected_status = true;
        }

        if (Store.luckysheet_rows_selected_status) {
            if(event.shiftKey){
                //按住shift点击行索引选取范围
                let last = $.extend(true, {}, Store.luckysheet_select_save[Store.luckysheet_select_save.length - 1]); //选区最后一个

                let top = 0, height = 0, rowseleted = [];
                if (last.top > row_pre) {
                    top = row_pre;
                    height = last.top + last.height - row_pre;

                    if(last.row[1] > last.row_focus){
                        last.row[1] = last.row_focus;
                    }

                    rowseleted = [row_index, last.row[1]];
                }
                else if (last.top == row_pre) {
                    top = row_pre;
                    height = last.top + last.height - row_pre;
                    rowseleted = [row_index, last.row[0]];
                }
                else {
                    top = last.top;
                    height = row - last.top - 1;

                    if(last.row[0] < last.row_focus){
                        last.row[0] = last.row_focus;
                    }

                    rowseleted = [last.row[0], row_index];
                }

                last["row"] = rowseleted;

                last["top_move"] = top;
                last["height_move"] = height;

                Store.luckysheet_select_save[Store.luckysheet_select_save.length - 1] = last;
            }
            else if(event.ctrlKey){
                Store.luckysheet_select_save.push({ 
                    "left": colLocationByIndex(0)[0],
                    "width": colLocationByIndex(0)[1] - colLocationByIndex(0)[0] - 1,
                    "top": top,
                    "height": height,
                    "left_move": col_pre,
                    "width_move": col - col_pre - 1,
                    "top_move": top,
                    "height_move": height,
                    "row": rowseleted,
                    "column": [0, col_index],
                    "row_focus": row_index,
                    "column_focus": 0
                });
            }
            else{
                Store.luckysheet_select_save = [];
                Store.luckysheet_select_save.push({ 
                    "left": colLocationByIndex(0)[0],
                    "width": colLocationByIndex(0)[1] - colLocationByIndex(0)[0] - 1,
                    "top": top,
                    "height": height,
                    "left_move": col_pre, 
                    "width_move": col - col_pre - 1, 
                    "top_move": top, 
                    "height_move": height, 
                    "row": rowseleted, 
                    "column": [0, col_index], 
                    "row_focus": row_index, 
                    "column_focus": 0
                });
            }

            selectHightlightShow();

            if(server.allowUpdate){
                //允许编辑后的后台更新时
                server.saveParam("mv", Store.currentSheetIndex, Store.luckysheet_select_save);
            }
        }

        $("#luckysheet-helpbox-cell").text(getRangetxt(Store.currentSheetIndex, Store.luckysheet_select_save[Store.luckysheet_select_save.length - 1]));

        setTimeout(function () {
            clearTimeout(Store.countfuncTimeout);
            countfunc();
        }, 101);
    }).mousemove(function (event) {
        if (Store.luckysheet_rows_selected_status || Store.luckysheet_rows_change_size || Store.luckysheet_select_status) {
            $("#luckysheet-rows-h-hover").hide();
            return;
        }

        let mouse = mouseposition(event.pageX, event.pageY);
        let y = mouse[1] + $("#luckysheet-rows-h").scrollTop();

        let row_location = rowLocation(y), 
            row = row_location[1], 
            row_pre = row_location[0], 
            row_index = row_location[2];

        $("#luckysheet-rows-h-hover").css({ "top": row_pre, "height": row - row_pre - 1, "display": "block" });

        if (y < row - 1 && y >= row - 5) {
            $("#luckysheet-rows-change-size").css({ "top": row - 3, "opacity": 0 });
        }
        else {
            $("#luckysheet-rows-change-size").css("opacity", 0);
        }
    }).mouseleave(function (event) {
        $("#luckysheet-rows-h-hover").hide();
        $("#luckysheet-rows-change-size").css("opacity", 0);
    }).mouseup(function (event) {
        if (event.which == 3) {
            if(isEditMode()){ //非编辑模式下禁止右键功能框
                return;
            }

            $("#luckysheet-cols-rows-shift").hide();
            Store.luckysheetRightHeadClickIs = "row";
            $("#luckysheet-rightclick-menu .luckysheet-cols-rows-shift-word").text(locale().rightclick.row);
            $("#luckysheet-rightclick-menu .luckysheet-cols-rows-shift-size").text(locale().rightclick.height);
            $("#luckysheet-rightclick-menu .luckysheet-cols-rows-shift-left").text(locale().rightclick.top);
            $("#luckysheet-rightclick-menu .luckysheet-cols-rows-shift-right").text(locale().rightclick.bottom);

            $("#luckysheet-cols-rows-add").show();
            $("#luckysheet-cols-rows-data").show();
            $("#luckysheet-cols-rows-shift").hide();
            $("#luckysheet-cols-rows-handleincell").hide();

            showrightclickmenu($("#luckysheet-rightclick-menu"), $(this).offset().left + 46, event.pageY);
            Store.luckysheet_cols_menu_status = true;

            //行高默认值
            let cfg = $.extend(true, {}, Store.config);
            if(cfg["rowlen"] == null){
                cfg["rowlen"] = {};
            }

            let first_rowlen = cfg["rowlen"][Store.luckysheet_select_save[0].row[0]] == null ? Store.defaultrowlen : cfg["rowlen"][Store.luckysheet_select_save[0].row[0]];
            let isSame = true;

            for(let i = 0; i < Store.luckysheet_select_save.length; i++){
                let s = Store.luckysheet_select_save[i];
                let r1 = s.row[0], r2 = s.row[1];

                for(let r = r1; r <= r2; r++){
                    let rowlen = cfg["rowlen"][r] == null ? Store.defaultrowlen : cfg["rowlen"][r];

                    if(rowlen != first_rowlen){
                        isSame = false;
                        break;
                    }
                }
            }

            if(isSame){
                $("#luckysheet-cols-rows-add").find("input[type='number'].rcsize").val(first_rowlen);
            }
            else{
                $("#luckysheet-cols-rows-add").find("input[type='number'].rcsize").val("");
            }
        }
    });
    
    //表格列标题 mouse事件
    $("#luckysheet-cols-h-c").mousedown(function (event) {
        //有批注在编辑时
        luckysheetPostil.removeActivePs();

        let mouse = mouseposition(event.pageX, event.pageY);
        let x = mouse[0] + $(this).scrollLeft();

        let row_index = Store.visibledatarow.length - 1, 
            row = Store.visibledatarow[row_index], row_pre = 0;
        let col_location = colLocation(x), 
            col = col_location[1], 
            col_pre = col_location[0], 
            col_index = col_location[2];

        Store.orderbyindex = col_index;//排序全局函数

        $("#luckysheet-rightclick-menu").hide();
        $("#luckysheet-sheet-list, #luckysheet-rightclick-sheet-menu").hide();
        $("#luckysheet-filter-menu, #luckysheet-filter-submenu").hide();

        //mousedown是右键
        if (event.which == "3") {
            let isright = false;

            for(let s = 0; s < Store.luckysheet_select_save.length; s++){
                let obj_s = Store.luckysheet_select_save[s];

                if(obj_s["column"] != null && (col_index >= obj_s["column"][0] && col_index <= obj_s["column"][1]) && (obj_s["row"][0] == 0 && obj_s["row"][1] == Store.flowdata.length - 1)){
                    isright = true;
                    break;
                }
            }

            if(isright){
                return;
            }
        }

        let left = col_pre, width = col - col_pre - 1;
        let columnseleted = [col_index, col_index];

        Store.luckysheet_scroll_status = true;

        //公式相关
        let $input = $("#luckysheet-input-box");
        if (parseInt($input.css("top")) > 0) {
            if (formula.rangestart || formula.rangedrag_column_start || formula.rangedrag_row_start || formula.israngeseleciton() || $("#luckysheet-ifFormulaGenerator-multiRange-dialog").is(":visible")) {
                //公式选区
                let changeparam = menuButton.mergeMoveMain(columnseleted, [0, row_index], {"row_focus": 0, "column_focus": col_index}, row_pre, row, left, width);
                if(changeparam != null){
                    columnseleted = changeparam[0];
                    //rowseleted= changeparam[1];
                    //top = changeparam[2];
                    //height = changeparam[3];
                    left = changeparam[4];
                    width = changeparam[5];
                }

                if(event.shiftKey){
                    let last = formula.func_selectedrange;

                    let left = 0, width = 0, columnseleted = [];
                    if (last.left > col_pre) {
                        left = col_pre;
                        width = last.left + last.width - col_pre;

                        if(last.column[1] > last.column_focus){
                            last.column[1] = last.column_focus;
                        }

                        columnseleted = [col_index, last.column[1]];
                    }
                    else if (last.left == col_pre) {
                        left = col_pre;
                        width = last.left + last.width - col_pre;
                        columnseleted = [col_index, last.column[0]];
                    }
                    else {
                        left = last.left;
                        width = col - last.left - 1;

                        if(last.column[0] < last.column_focus){
                            last.column[0] = last.column_focus;
                        }

                        columnseleted = [last.column[0], col_index];
                    }

                    let changeparam = menuButton.mergeMoveMain(columnseleted , [0, row_index], {"row_focus": 0, "column_focus": col_index}, row_pre, row, left, width);
                    if(changeparam != null){
                        columnseleted = changeparam[0];
                        //rowseleted= changeparam[1];
                        //top = changeparam[2];
                        //height = changeparam[3];
                        left = changeparam[4];
                        width = changeparam[5];
                    }

                    last["column"] = columnseleted;

                    last["left_move"] = left;
                    last["width_move"] = width;

                    formula.func_selectedrange = last;
                }
                else if(event.ctrlKey && $("#luckysheet-rich-text-editor").find("span").last().text() != ","){
                    //按住ctrl 选择选区时  先处理上一个选区
                    let vText = $("#luckysheet-rich-text-editor").text() + ",";
                    if(vText.length > 0 && vText.substr(0, 1) == "="){
                        vText = formula.functionHTMLGenerate(vText);

                        if (window.getSelection) { // all browsers, except IE before version 9
                            let currSelection = window.getSelection();
                            formula.functionRangeIndex = [$(currSelection.anchorNode).parent().index(), currSelection.anchorOffset];
                        } 
                        else { // Internet Explorer before version 9
                            let textRange = document.selection.createRange();
                            formula.functionRangeIndex = textRange;
                        }

                        $("#luckysheet-rich-text-editor").html(vText);

                        formula.canceFunctionrangeSelected();
                        formula.createRangeHightlight();
                    }

                    formula.rangestart = false;
                    formula.rangedrag_column_start = false;
                    formula.rangedrag_row_start = false;

                    $("#luckysheet-functionbox-cell").html(vText);
                    formula.rangeHightlightselected($("#luckysheet-rich-text-editor"));

                    //再进行 选区的选择
                    formula.israngeseleciton();
                    formula.func_selectedrange = {
                        "left": left, 
                        "width": width, 
                        "top": rowLocationByIndex(0)[0], 
                        "height": rowLocationByIndex(0)[1] - rowLocationByIndex(0)[0] - 1, 
                        "left_move": left, 
                        "width_move": width, 
                        "top_move": row_pre, 
                        "height_move": row - row_pre - 1, 
                        "row": [0, row_index], 
                        "column": columnseleted,
                        "row_focus": 0, 
                        "column_focus": col_index 
                    }
                }
                else{
                    formula.func_selectedrange = {
                        "left": left, 
                        "width": width, 
                        "top": rowLocationByIndex(0)[0], 
                        "height": rowLocationByIndex(0)[1] - rowLocationByIndex(0)[0] - 1, 
                        "left_move": left, 
                        "width_move": width, 
                        "top_move": row_pre, 
                        "height_move": row - row_pre - 1, 
                        "row": [0, row_index], 
                        "column": columnseleted,
                        "row_focus": 0, 
                        "column_focus": col_index 
                    }
                }

                if(formula.rangestart || formula.rangedrag_column_start || formula.rangedrag_row_start || formula.israngeseleciton()){
                    formula.rangeSetValue({ "row": [null, null], "column": columnseleted });
                }
                else if($("#luckysheet-ifFormulaGenerator-multiRange-dialog").is(":visible")){//if公式生成器
                    let range = getRangetxt(Store.currentSheetIndex, { "row": [0, row_index], "column": columnseleted }, Store.currentSheetIndex);
                    $("#luckysheet-ifFormulaGenerator-multiRange-dialog input").val(range);
                }

                formula.rangedrag_column_start = true;
                formula.rangestart = false;
                formula.rangedrag_row_start = false;

                $("#luckysheet-formula-functionrange-select").css({ 
                    "left": left, 
                    "width": width, 
                    "top": row_pre, 
                    "height": row - row_pre - 1 
                }).show();
                $("#luckysheet-formula-help-c").hide();

                luckysheet_count_show(left, row_pre, width, row - row_pre - 1, [0, row_index], columnseleted);

                return;
            }
            else {
                formula.updatecell(Store.luckysheetCellUpdate[0], Store.luckysheetCellUpdate[1]);
                Store.luckysheet_cols_selected_status = true;
            }
        }
        else {
            Store.luckysheet_cols_selected_status = true;
        }

        if (Store.luckysheet_cols_selected_status) {
            if(event.shiftKey){
                //按住shift点击列索引选取范围
                let last = $.extend(true, {}, Store.luckysheet_select_save[Store.luckysheet_select_save.length - 1]); //选区最后一个

                let left = 0, width = 0, columnseleted = [];
                if (last.left > col_pre) {
                    left = col_pre;
                    width = last.left + last.width - col_pre;

                    if(last.column[1] > last.column_focus){
                        last.column[1] = last.column_focus;
                    }

                    columnseleted = [col_index, last.column[1]];
                }
                else if (last.left == col_pre) {
                    left = col_pre;
                    width = last.left + last.width - col_pre;
                    columnseleted = [col_index, last.column[0]];
                }
                else {
                    left = last.left;
                    width = col - last.left - 1;

                    if(last.column[0] < last.column_focus){
                        last.column[0] = last.column_focus;
                    }

                    columnseleted = [last.column[0], col_index];
                }

                last["column"] = columnseleted;

                last["left_move"] = left;
                last["width_move"] = width;

                Store.luckysheet_select_save[Store.luckysheet_select_save.length - 1] = last;
            }
            else if(event.ctrlKey){
                //选区添加
                Store.luckysheet_select_save.push({ 
                    "left": left, 
                    "width": width, 
                    "top": rowLocationByIndex(0)[0], 
                    "height": rowLocationByIndex(0)[1] - rowLocationByIndex(0)[0] - 1, 
                    "left_move": left, 
                    "width_move": width, 
                    "top_move": row_pre, 
                    "height_move": row - row_pre - 1, 
                    "row": [0, row_index], 
                    "column": columnseleted,
                    "row_focus": 0,  
                    "column_focus": col_index 
                });
            }
            else{
                Store.luckysheet_select_save = [];
                Store.luckysheet_select_save.push({ 
                    "left": left, 
                    "width": width, 
                    "top": rowLocationByIndex(0)[0], 
                    "height": rowLocationByIndex(0)[1] - rowLocationByIndex(0)[0] - 1, 
                    "left_move": left, 
                    "width_move": width, 
                    "top_move": row_pre, 
                    "height_move": row - row_pre - 1, 
                    "row": [0, row_index], 
                    "column": columnseleted,
                    "row_focus": 0, 
                    "column_focus": col_index 
                });
            }

            selectHightlightShow();

            if(server.allowUpdate){
                //允许编辑后的后台更新时
                server.saveParam("mv", Store.currentSheetIndex, Store.luckysheet_select_save);
            }
        }
        
        $("#luckysheet-helpbox-cell").text(getRangetxt(Store.currentSheetIndex, Store.luckysheet_select_save[Store.luckysheet_select_save.length - 1]));

        setTimeout(function () {
            clearTimeout(Store.countfuncTimeout);
            countfunc();
        }, 101);

        if (Store.luckysheet_cols_menu_status) {
            $("#luckysheet-rightclick-menu").hide();
            $("#luckysheet-cols-h-hover").hide();
            $("#luckysheet-cols-menu-btn").hide();
            Store.luckysheet_cols_menu_status = false;
        }
        event.stopPropagation();
    }).mousemove(function (event) {
        if (Store.luckysheet_cols_selected_status || Store.luckysheet_select_status) {
            $("#luckysheet-cols-h-hover").hide();
            $("#luckysheet-cols-menu-btn").hide();
            return;
        }

        if (Store.luckysheet_cols_menu_status || Store.luckysheet_cols_change_size) {
            return;
        }

        let mouse = mouseposition(event.pageX, event.pageY);
        let x = mouse[0] + $("#luckysheet-cols-h-c").scrollLeft();

        let col_location = colLocation(x), 
            col = col_location[1], 
            col_pre = col_location[0], 
            col_index = col_location[2];

        $("#luckysheet-cols-h-hover").css({ "left": col_pre, "width": col - col_pre - 1, "display": "block" });
        $("#luckysheet-cols-menu-btn").css({ "left": col - 19, "display": "block" });

        $("#luckysheet-cols-change-size").css({ "left": col - 5 });
        if (x < col && x >= col - 5) {
            $("#luckysheet-cols-change-size").css({ "opacity": 0 });
            $("#luckysheet-cols-menu-btn").hide();
        }
        else {
            $("#luckysheet-change-size-line").hide();
            $("#luckysheet-cols-change-size").css("opacity", 0);
        }
    }).mouseleave(function (event) {
        if (Store.luckysheet_cols_menu_status || Store.luckysheet_cols_change_size) {
            return;
        }

        $("#luckysheet-cols-h-hover").hide();
        $("#luckysheet-cols-menu-btn").hide();
        $("#luckysheet-cols-change-size").css("opacity", 0);
    }).mouseup(function (event) {
        if (event.which == 3) {
            if(isEditMode()){ //非编辑模式下禁止右键功能框
                return;
            }

            Store.luckysheetRightHeadClickIs = "column";
            $("#luckysheet-rightclick-menu .luckysheet-cols-rows-shift-word").text(locale().rightclick.column);
            $("#luckysheet-rightclick-menu .luckysheet-cols-rows-shift-size").text(locale().rightclick.width);
            $("#luckysheet-rightclick-menu .luckysheet-cols-rows-shift-left").text(locale().rightclick.left);
            $("#luckysheet-rightclick-menu .luckysheet-cols-rows-shift-right").text(locale().rightclick.right);

            $("#luckysheet-cols-rows-add").show();
            $("#luckysheet-cols-rows-data").show();
            $("#luckysheet-cols-rows-shift").hide();
            $("#luckysheet-cols-rows-handleincell").hide();

            showrightclickmenu($("#luckysheet-rightclick-menu"), event.pageX, $(this).offset().top + 18);
            Store.luckysheet_cols_menu_status = true;

            //列宽默认值
            let cfg = $.extend(true, {}, Store.config);
            if(cfg["columlen"] == null){
                cfg["columlen"] = {};
            }

            let first_collen = cfg["columlen"][Store.luckysheet_select_save[0].column[0]] == null ? Store.defaultcollen : cfg["columlen"][Store.luckysheet_select_save[0].column[0]];
            let isSame = true;

            for(let i = 0; i < Store.luckysheet_select_save.length; i++){
                let s = Store.luckysheet_select_save[i];
                let c1 = s.column[0], c2 = s.column[1];

                for(let c = c1; c <= c2; c++){
                    let collen = cfg["columlen"][c] == null ? Store.defaultcollen : cfg["columlen"][c];

                    if(collen != first_collen){
                        isSame = false;
                        break;
                    }
                }
            }

            if(isSame){
                $("#luckysheet-cols-rows-add").find("input[type='number'].rcsize").val(first_collen);
            }
            else{
                $("#luckysheet-cols-rows-add").find("input[type='number'].rcsize").val("");
            }
        }
    });


    //表格行标题 改变行高按钮
    $("#luckysheet-rows-change-size").mousedown(function (event) {
        //有批注在编辑时
        luckysheetPostil.removeActivePs();
        
        $("#luckysheet-input-box").hide();
        $("#luckysheet-rows-change-size").css({ "opacity": 1 });

        let mouse = mouseposition(event.pageX, event.pageY);
        let y = mouse[1] + $("#luckysheet-rows-h").scrollTop();

        let scrollLeft = $("#luckysheet-cell-main").scrollLeft();
        let winW = $("#luckysheet-cell-main").width();

        let row_location = rowLocation(y), 
            row = row_location[1], 
            row_pre = row_location[0], 
            row_index = row_location[2];

        Store.luckysheet_rows_change_size = true;
        Store.luckysheet_scroll_status = true;
        $("#luckysheet-change-size-line").css({ 
            "height": "1px", 
            "border-width": 
            "0 0px 1px 0", 
            "top": row - 3, 
            "left": 0, 
            "width": scrollLeft + winW, 
            "display": "block", 
            "cursor": "ns-resize" 
        });
        $("#luckysheet-sheettable, #luckysheet-rows-h, #luckysheet-rows-h canvas").css("cursor", "ns-resize");
        Store.luckysheet_rows_change_size_start = [row_pre, row_index];
        $("#luckysheet-rightclick-menu").hide();
        $("#luckysheet-rows-h-hover").hide();
        $("#luckysheet-cols-menu-btn").hide();
        event.stopPropagation();
    });

    //表格列标题 改变列宽按钮
    $("#luckysheet-cols-change-size").mousedown(function (event) {
        //有批注在编辑时
        luckysheetPostil.removeActivePs();

        $("#luckysheet-input-box").hide();
        $("#luckysheet-cols-change-size").css({ "opacity": 1 });

        let mouse = mouseposition(event.pageX, event.pageY);
        let scrollLeft = $("#luckysheet-cols-h-c").scrollLeft();
        let scrollTop = $("#luckysheet-cell-main").scrollTop();
        let winH = $("#luckysheet-cell-main").height();
        let x = mouse[0] + scrollLeft;

        let row_index = Store.visibledatarow.length - 1, 
            row = Store.visibledatarow[row_index], row_pre = 0;
        let col_location = colLocation(x), 
            col = col_location[1], 
            col_pre = col_location[0], 
            col_index = col_location[2];

        Store.luckysheet_cols_change_size = true;
        Store.luckysheet_scroll_status = true;
        $("#luckysheet-change-size-line").css({ 
            "height": winH + scrollTop, 
            "border-width": "0 1px 0 0", 
            "top": 0, 
            "left": col - 3, 
            "width": "1px", 
            "display": "block", 
            "cursor": "ew-resize" 
        });
        $("#luckysheet-sheettable, #luckysheet-cols-h-c, .luckysheet-cols-h-cells, .luckysheet-cols-h-cells canvas").css("cursor", "ew-resize");
        Store.luckysheet_cols_change_size_start = [col_pre, col_index];
        $("#luckysheet-rightclick-menu").hide();
        $("#luckysheet-cols-h-hover").hide();
        $("#luckysheet-cols-menu-btn").hide();
        Store.luckysheet_cols_dbclick_times = 0;
        event.stopPropagation();
    }).dblclick(function () {
        luckysheetcolsdbclick();
    });

    $("#luckysheet-cols-menu-btn").click(function (event) {
        let $menu = $("#luckysheet-rightclick-menu");
        let offset = $(this).offset();
        $("#luckysheet-cols-rows-shift").show();
        Store.luckysheetRightHeadClickIs = "column";
        $("#luckysheet-rightclick-menu .luckysheet-cols-rows-shift-word").text(locale().rightclick.column);
        $("#luckysheet-rightclick-menu .luckysheet-cols-rows-shift-left").text(locale().rightclick.left);
        $("#luckysheet-rightclick-menu .luckysheet-cols-rows-shift-right").text(locale().rightclick.right);

        $("#luckysheet-cols-rows-add").show();
        $("#luckysheet-cols-rows-data").hide();
        $("#luckysheet-cols-rows-shift").show();
        $("#luckysheet-cols-rows-handleincell").hide();

        showrightclickmenu($menu, offset.left, offset.top + 18);
        Store.luckysheet_cols_menu_status = true;
    });

    //向左增加列，向上增加行
    $("#luckysheet-add-lefttop, #luckysheet-add-lefttop_t").click(function (event) {
        $("#luckysheet-rightclick-menu").hide();
        $("#" + Store.container).attr("tabindex", 0).focus();
        
        if(Store.luckysheet_select_save.length > 1){
            if(isEditMode()){
                alert(locale_drag.noMulti);
            }
            else{
                tooltip.info(locale_drag.noMulti, "");
            }

            return;
        }

        let $t = $(this), value = $t.parent().find("input").val();
        if (!isRealNum(value)) {
            if(isEditMode()){
                alert(locale_info.tipInputNumber);
            }
            else{
                tooltip.info(locale_info.tipInputNumber, "");
            }

            return;
        }

        value = parseInt(value);

        if (value < 1 || value > 100) {
            if(isEditMode()){
                alert(locale_info.tipInputNumberLimit);
            }
            else{
                tooltip.info(locale_info.tipInputNumberLimit, ""); 
            }
            return;
        }

        let st_index = Store.luckysheet_select_save[0][Store.luckysheetRightHeadClickIs][0];
        luckysheetextendtable(Store.luckysheetRightHeadClickIs, st_index, value, "lefttop");
    });
    $("#luckysheet-addTopRows").click(function (event) {
        $("#luckysheet-rightclick-menu").hide();
        $("#" + Store.container).attr("tabindex", 0).focus();
        
        if(Store.luckysheet_select_save.length > 1){
            if(isEditMode()){
                alert(locale_drag.noMulti);
            }
            else{
                tooltip.info(locale_drag.noMulti, "");
            }

            return;
        }

        let $t = $(this), value = $t.parent().find("input").val();
        if (!isRealNum(value)) {
            if(isEditMode()){
                alert(locale_info.tipInputNumber);
            }
            else{
                tooltip.info(locale_info.tipInputNumber, "");
            }

            return;
        }

        value = parseInt(value);

        if (value < 1 || value > 100) {
            if(isEditMode()){
                alert(llocale_info.tipInputNumberLimit);
            }
            else{
                tooltip.info(llocale_info.tipInputNumberLimit, ""); 
            }
            return;
        }

        let st_index = Store.luckysheet_select_save[0].row[0];
        luckysheetextendtable('row', st_index, value, "lefttop");
    })
    $("#luckysheet-addLeftCols").click(function (event) {
        $("#luckysheet-rightclick-menu").hide();
        $("#" + Store.container).attr("tabindex", 0).focus();
        
        if(Store.luckysheet_select_save.length > 1){
            if(isEditMode()){
                alert(locale_drag.noMulti);
            }
            else{
                tooltip.info(locale_drag.noMulti, "");
            }

            return;
        }

        let $t = $(this), value = $t.parent().find("input").val();
        if (!isRealNum(value)) {
            if(isEditMode()){
                alert(locale_info.tipInputNumber);
            }
            else{
                tooltip.info(locale_info.tipInputNumber, "");
            }

            return;
        }

        value = parseInt(value);

        if (value < 1 || value > 100) {
            if(isEditMode()){
                alert(llocale_info.tipInputNumberLimit);
            }
            else{
                tooltip.info(llocale_info.tipInputNumberLimit, ""); 
            }
            return;
        }

        let st_index = Store.luckysheet_select_save[0].column[0];
        luckysheetextendtable('column', st_index, value, "lefttop");
    })

    //向右增加列，向下增加行
    $("#luckysheet-add-rightbottom, #luckysheet-add-rightbottom_t").click(function (event) {
        $("#luckysheet-rightclick-menu").hide();
        $("#" + Store.container).attr("tabindex", 0).focus();

        if(Store.luckysheet_select_save.length > 1){
            if(isEditMode()){
                alert(locale_drag.noMulti);
            }
            else{
                tooltip.info(locale_drag.noMulti, "");
            }

            return;
        }

        let $t = $(this), value = $t.parent().find("input").val();
        if (!isRealNum(value)) {
            if(isEditMode()){
                alert(locale_info.tipInputNumber);
            }
            else{
                tooltip.info(locale_info.tipInputNumber, ""); 
            }

            return;
        }

        value = parseInt(value);

        if (value < 1 || value > 100) {
            if(isEditMode()){
                alert(llocale_info.tipInputNumberLimit);
            }
            else{
                tooltip.info(llocale_info.tipInputNumberLimit, "");
            }

            return;
        }

        let st_index = Store.luckysheet_select_save[0][Store.luckysheetRightHeadClickIs][1];
        luckysheetextendtable(Store.luckysheetRightHeadClickIs, st_index, value, "rightbottom");
    });
    $("#luckysheet-addBottomRows").click(function (event) {
        $("#luckysheet-rightclick-menu").hide();
        $("#" + Store.container).attr("tabindex", 0).focus();

        if(Store.luckysheet_select_save.length > 1){
            if(isEditMode()){
                alert(locale_drag.noMulti);
            }
            else{
                tooltip.info(locale_drag.noMulti, "");
            }

            return;
        }

        let $t = $(this), value = $t.parent().find("input").val();
        if (!isRealNum(value)) {
            if(isEditMode()){
                alert(locale_info.tipInputNumber);
            }
            else{
                tooltip.info(locale_info.tipInputNumber, ""); 
            }

            return;
        }

        value = parseInt(value);

        if (value < 1 || value > 100) {
            if(isEditMode()){
                alert(llocale_info.tipInputNumberLimit);
            }
            else{
                tooltip.info(llocale_info.tipInputNumberLimit, "");
            }

            return;
        }

        let st_index = Store.luckysheet_select_save[0].row[1];
        luckysheetextendtable('row', st_index, value, "rightbottom");
    });
    $("#luckysheet-addRightCols").click(function (event) {
        $("#luckysheet-rightclick-menu").hide();
        $("#" + Store.container).attr("tabindex", 0).focus();

        if(Store.luckysheet_select_save.length > 1){
            if(isEditMode()){
                alert(locale_drag.noMulti);
            }
            else{
                tooltip.info(locale_drag.noMulti, "");
            }

            return;
        }

        let $t = $(this), value = $t.parent().find("input").val();
        if (!isRealNum(value)) {
            if(isEditMode()){
                alert(locale_info.tipInputNumber);
            }
            else{
                tooltip.info(locale_info.tipInputNumber, ""); 
            }

            return;
        }

        value = parseInt(value);

        if (value < 1 || value > 100) {
            if(isEditMode()){
                alert(llocale_info.tipInputNumberLimit);
            }
            else{
                tooltip.info(llocale_info.tipInputNumberLimit, "");
            }

            return;
        }

        let st_index = Store.luckysheet_select_save[0].column[1];
        luckysheetextendtable('column', st_index, value, "rightbottom");
    });
    
    //删除选中行列
    $("#luckysheet-del-selected, #luckysheet-del-selected_t").click(function (event) {
        $("#luckysheet-rightclick-menu").hide();
        $("#" + Store.container).attr("tabindex", 0).focus();

        if(Store.luckysheet_select_save.length > 1){
            if(Store.luckysheetRightHeadClickIs == "row"){
                if(isEditMode()){
                    alert(locale_drag.noMulti);
                }
                else{
                    tooltip.info(locale_drag.noMulti, "");
                }
            }
            else if(Store.luckysheetRightHeadClickIs == "column"){
                if(isEditMode()){
                    alert(locale_drag.noMulti);
                }
                else{
                    tooltip.info(locale_drag.noMulti, ""); 
                }
            }
            return;
        }

        let st_index = Store.luckysheet_select_save[0][Store.luckysheetRightHeadClickIs][0], 
            ed_index = Store.luckysheet_select_save[0][Store.luckysheetRightHeadClickIs][1];
        luckysheetdeletetable(Store.luckysheetRightHeadClickIs, st_index, ed_index);
    });
    $("#luckysheet-delRows").click(function (event) {
        $("#luckysheet-rightclick-menu").hide();
        $("#" + Store.container).attr("tabindex", 0).focus();

        if(Store.luckysheet_select_save.length > 1){
            if(Store.luckysheetRightHeadClickIs == "row"){
                if(isEditMode()){
                    alert(locale_drag.noMulti);
                }
                else{
                    tooltip.info(locale_drag.noMulti, "");
                }
            }
            else if(Store.luckysheetRightHeadClickIs == "column"){
                if(isEditMode()){
                    alert(locale_drag.noMulti);
                }
                else{
                    tooltip.info(locale_drag.noMulti, ""); 
                }
            }
            return;
        }

        let st_index = Store.luckysheet_select_save[0].row[0], 
            ed_index = Store.luckysheet_select_save[0].row[1];
        luckysheetdeletetable('row', st_index, ed_index);
    })
    $("#luckysheet-delCols").click(function (event) {
        $("#luckysheet-rightclick-menu").hide();
        $("#" + Store.container).attr("tabindex", 0).focus();

        if(Store.luckysheet_select_save.length > 1){
            if(Store.luckysheetRightHeadClickIs == "row"){
                if(isEditMode()){
                    alert(locale_drag.noMulti);
                }
                else{
                    tooltip.info(locale_drag.noMulti, "");
                }
            }
            else if(Store.luckysheetRightHeadClickIs == "column"){
                if(isEditMode()){
                    alert(locale_drag.noMulti);
                }
                else{
                    tooltip.info(locale_drag.noMulti, ""); 
                }
            }
            return;
        }

        let st_index = Store.luckysheet_select_save[0].column[0], 
            ed_index = Store.luckysheet_select_save[0].column[1];
        luckysheetdeletetable('column', st_index, ed_index);
    })

    //隐藏、显示行
    $("#luckysheet-hidRows").click(function (event) {
        $("#luckysheet-rightclick-menu").hide();
        $("#" + Store.container).attr("tabindex", 0).focus();

        let cfg = $.extend(true, {}, Store.config);
        if(cfg["rowhidden"] == null){
            cfg["rowhidden"] = {};
        }

        for(let s = 0; s < Store.luckysheet_select_save.length; s++){
            let r1 = Store.luckysheet_select_save[s].row[0],
                r2 = Store.luckysheet_select_save[s].row[1],
                c1 = Store.luckysheet_select_save[s].column[0],
                c2 = Store.luckysheet_select_save[s].column[1];

            for(let r = r1; r <= r2; r++){
                cfg["rowhidden"][r] = 0;
            }
        }
    
        //保存撤销
        if(Store.clearjfundo){
            let redo = {};
            redo["type"] = "showHidRows";
            redo["sheetIndex"] = Store.currentSheetIndex;
            redo["config"] = $.extend(true, {}, Store.config);
            redo["curconfig"] = cfg;
    
            Store.jfundo = [];
            Store.jfredo.push(redo);
        }
    
        //config
        Store.config = cfg;
        Store.luckysheetfile[getSheetIndex(Store.currentSheetIndex)].config = Store.config;
    
        server.saveParam("cg", Store.currentSheetIndex, cfg["rowhidden"], { "k": "rowhidden" });
    
        //行高、列宽 刷新  
        jfrefreshgrid_rhcw(Store.flowdata.length, Store.flowdata[0].length);
    })
    $("#luckysheet-showHidRows").click(function (event) {
        $("#luckysheet-rightclick-menu").hide();
        $("#" + Store.container).attr("tabindex", 0).focus();

        let cfg = $.extend(true, {}, Store.config);
        if(cfg["rowhidden"] == null){
            return;
        }

        for(let s = 0; s < Store.luckysheet_select_save.length; s++){
            let r1 = Store.luckysheet_select_save[s].row[0],
                r2 = Store.luckysheet_select_save[s].row[1],
                c1 = Store.luckysheet_select_save[s].column[0],
                c2 = Store.luckysheet_select_save[s].column[1];

            for(let r = r1; r <= r2; r++){
                delete cfg["rowhidden"][r];
            }
        }
    
        //保存撤销
        if(Store.clearjfundo){
            let redo = {};
            redo["type"] = "showHidRows";
            redo["sheetIndex"] = Store.currentSheetIndex;
            redo["config"] = $.extend(true, {}, Store.config);
            redo["curconfig"] = cfg;
    
            Store.jfundo = [];
            Store.jfredo.push(redo);
        }
    
        //config
        Store.config = cfg;
        Store.luckysheetfile[getSheetIndex(Store.currentSheetIndex)].config = Store.config;
    
        server.saveParam("cg", Store.currentSheetIndex, cfg["rowhidden"], { "k": "rowhidden" });
    
        //行高、列宽 刷新  
        jfrefreshgrid_rhcw(Store.flowdata.length, Store.flowdata[0].length);
    })

    //清除单元格内容
    $("#luckysheet-delete-text").click(function(){
        $("#luckysheet-rightclick-menu").hide();
        $("#" + Store.container).attr("tabindex", 0).focus();

        if(Store.luckysheet_select_save.length > 0){
            let d = editor.deepCopyFlowData(Store.flowdata);

            let has_PartMC = false;

            for(let s = 0; s < Store.luckysheet_select_save.length; s++){
                let r1 = Store.luckysheet_select_save[s].row[0], 
                    r2 = Store.luckysheet_select_save[s].row[1];
                let c1 = Store.luckysheet_select_save[s].column[0], 
                    c2 = Store.luckysheet_select_save[s].column[1];

                if(hasPartMC(Store.config, r1, r2, c1, c2)){
                    has_PartMC = true;
                    break;
                }
            }

            if(has_PartMC){
                if(isEditMode()){
                    alert(locale_drag.noPartMerge);
                }
                else{
                    tooltip.info(locale_drag.noPartMerge, "");
                }

                return;
            }

            for(let s = 0; s < Store.luckysheet_select_save.length; s++){
                let r1 = Store.luckysheet_select_save[s].row[0], 
                    r2 = Store.luckysheet_select_save[s].row[1];
                let c1 = Store.luckysheet_select_save[s].column[0], 
                    c2 = Store.luckysheet_select_save[s].column[1];

                for(let r = r1; r <= r2; r++){
                    for(let c = c1; c <= c2; c++){
                        if(pivotTable.isPivotRange(r, c)){
                            continue;
                        }

                        if(getObjType(d[r][c]) == "object"){
                            delete d[r][c]["m"];
                            delete d[r][c]["v"];

                            if(d[r][c]["f"] != null){
                                delete d[r][c]["f"];
                                formula.delFunctionGroup(r, c, Store.currentSheetIndex);

                                delete d[r][c]["spl"];
                            }
                        }
                        else{
                            d[r][c] = null;
                        }
                    }
                }
            }

            jfrefreshgrid(d, Store.luckysheet_select_save);
        }
    });

    //行高列宽设置
    $("#luckysheet-rows-cols-changesize").click(function(){
        $("#luckysheet-rightclick-menu").hide();
        $("#" + Store.container).attr("tabindex", 0).focus();

        let size = parseInt($(this).siblings("input[type='number']").val().trim());

        if(size < 0 || size > 255){
            if(isEditMode()){
                alert(llocale_info.tipRowHeightLimit);
            }
            else{
                tooltip.info(llocale_info.tipRowHeightLimit, "");
            }
            
            return;
        }

        let cfg = $.extend(true, {}, Store.config);
        let type;

        if(Store.luckysheetRightHeadClickIs == "row"){
            type = "resizeR";

            if(cfg["rowlen"] == null){
                cfg["rowlen"] = {};
            }

            for(let s = 0; s < Store.luckysheet_select_save.length; s++){
                let r1 = Store.luckysheet_select_save[s].row[0];
                let r2 = Store.luckysheet_select_save[s].row[1];

                for(let r = r1; r <= r2; r++){
                    cfg["rowlen"][r] = size;
                }
            }
        }
        else if(Store.luckysheetRightHeadClickIs == "column"){
            type = "resizeC";

            if(cfg["columlen"] == null){
                cfg["columlen"] = {};
            }

            for(let s = 0; s < Store.luckysheet_select_save.length; s++){
                let c1 = Store.luckysheet_select_save[s].column[0];
                let c2 = Store.luckysheet_select_save[s].column[1];

                for(let c = c1; c <= c2; c++){
                    cfg["columlen"][c] = size;
                }
            }
        }

        if (Store.clearjfundo) {
            Store.jfundo = [];
            Store.jfredo.push({
                "type": "resize",
                "ctrlType": type,
                "config": $.extend(true, {}, Store.config),
                "curconfig": $.extend(true, {}, cfg),
                "sheetIndex": Store.currentSheetIndex
            });
        }

        //config
        Store.config = cfg;
        Store.luckysheetfile[getSheetIndex(Store.currentSheetIndex)].config = Store.config;

        if(Store.luckysheetRightHeadClickIs == "row"){
            server.saveParam("cg", Store.currentSheetIndex, cfg["rowlen"], { "k": "rowlen" });
            jfrefreshgrid_rhcw(Store.flowdata.length, null);
        }
        else if(Store.luckysheetRightHeadClickIs == "column"){
            server.saveParam("cg", Store.currentSheetIndex, cfg["columlen"], { "k": "columlen" });
            jfrefreshgrid_rhcw(null, Store.flowdata[0].length);
        }
    });
}


function luckysheetcolsdbclick() {
    Store.luckysheet_cols_change_size = false;
    $("#luckysheet-change-size-line").hide();
    $("#luckysheet-cols-change-size").css("opacity", 0);
    $("#luckysheet-sheettable, #luckysheet-cols-h-c, .luckysheet-cols-h-cells, .luckysheet-cols-h-cells canvas").css("cursor", "default");

    let mouse = mouseposition(event.pageX, event.pageY);
    let scrollLeft = $("#luckysheet-cols-h-c").scrollLeft();
    let x = mouse[0] + scrollLeft;
    let winW = $(window).width();

    let row_index = Store.visibledatarow.length - 1, 
        row = Store.visibledatarow[row_index], 
        row_pre = 0;
    let col_location = colLocation(x), 
        col = col_location[1], 
        col_pre = col_location[0], 
        col_index = col_location[2];
    Store.luckysheet_cols_change_size_start = [col_pre, col_index];
    let dataflow = $("#luckysheetTableContent").get(0).getContext("2d");
    let cfg = $.extend(true, {}, Store.config);

    let matchColumn = {};
    for(let s = 0; s < Store.luckysheet_select_save.length; s++){
        let c1 = Store.luckysheet_select_save[s].column[0], 
            c2 = Store.luckysheet_select_save[s].column[1];

        if (col_index < c1 || col_index > c2) {
            if(col_index in matchColumn){//此列已计算过
                continue;
            }

            x = -Infinity;
            let countret = 0;
            let fontsize = 13;
            for (let r = 0; r < Store.flowdata.length; r++) {
                if (countret >= 15) {
                    break;
                }

                let value = getcellvalue(r, Store.luckysheet_cols_change_size_start[1], Store.flowdata);
                let mask = getcellvalue(r, Store.luckysheet_cols_change_size_start[1], Store.flowdata, "m");

                if(mask != null){
                    value = mask;
                }

                let cell = Store.flowdata[r][Store.luckysheet_cols_change_size_start[1]];
                if(getObjType(cell) == "object" && ("fs" in cell)){
                    if(cell.fs > fontsize){
                        fontsize = cell.fs;
                    }
                }

                if (value == null || value.toString().length == 0) {
                    countret++;
                    continue;
                }
                let textMetrics = dataflow.measureText(value).width;
                if (textMetrics > x) {
                    x = textMetrics;
                }
            }

            let size = x + fontsize * 1.5;
            if ((x + 3) < 30) {
                size = 30;
            }

            if (x >= winW - 100 + scrollLeft) {
                size = winW - 100 + scrollLeft;
            }

            if (cfg["columlen"] == null) {
                cfg["columlen"] = {};
            }

            cfg["columlen"][Store.luckysheet_cols_change_size_start[1]] = Math.ceil(size);

            matchColumn[col_index] = 1;
        }
        else {
            for (let c = c1; c <= c2; c++) {
                if(c in matchColumn){//此列已计算过
                    continue;
                }

                x = -Infinity;
                let countret = 0;
                let fontsize = 13;
                for (let r = 0; r < Store.flowdata.length; r++) {
                    if (countret >= 15) {
                        break;
                    }
                    let value = getcellvalue(r, c, Store.flowdata);

                    let cell = Store.flowdata[r][c];
                    if(getObjType(cell) == "object" && ("fs" in cell)){
                        if(cell.fs > fontsize){
                            fontsize = cell.fs;
                        }
                    }

                    if (isRealNull(value)) {
                        countret++;
                        continue;
                    }

                    let textMetrics = dataflow.measureText(value).width;
                    if (textMetrics > x) {
                        x = textMetrics;
                    }
                }

                let size = x + fontsize*1.5;;
                if ((x + 3) < 30) {
                    size = 30;
                }

                if (x >= winW - 100 + scrollLeft) {
                    size = winW - 100 + scrollLeft;
                }

                if (cfg["columlen"] == null) {
                    cfg["columlen"] = {};
                }
                cfg["columlen"][c] = Math.ceil(size);

                matchColumn[c] = 1;
            }
        }
    }
   
    jfrefreshgridall(Store.flowdata[0].length, Store.flowdata.length, Store.flowdata, cfg, Store.luckysheet_select_save, "resizeC", "columlen");
}