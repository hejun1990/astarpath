/**
 * Created by hejun on 2017/10/27.
 */
$(function () {
    initMapBlock();
});

// 是否开始寻径。0:未开始;1:已开始
var beginSearch = false;

// 方块对象集合
var pointArray = new Array();

// 起点
var begin_point = null;

// 终点
var end_point = null;

// 障碍物列表
var hinderList = new Array();

// 路径列表
var pathList = new Array();

// 开启列表（待检查的方块列表）
var openList = new Array();

// 关闭列表（不需要检查的方块列表）
var closeList = new Array();

// 创建一个10*10的方格图
function initMapBlock() {
    var blockHtml = "";
    for (var x = 1; x <= 100; x++) {
        blockHtml += "<div id=\"point_" + x + "\" class=\"point\" index=\"" + x
            + "\" onclick=\"clickPoint(this)\"></div>";

        // X坐标
        var x_coordinate = (x % 10 != 0) ? (x % 10) : 10;
        // Y坐标
        var y_coordinate = (x % 10 != 0) ? Math.ceil(x / 10) : (x / 10);
        // 方块对象
        var point = {
            index: x,
            x: x_coordinate,
            y: y_coordinate,
            f: 0, // f = g + h
            g: 0, // 表示从起点 A 移动到网格上指定方格的移动耗费
            h: 0, // 表示从指定的方格移动到终点 B 的预计耗费
            is_hinder: 0, // 是否是障碍(0:否,1:是)
            is_begin: 0, // 是否是起点(0:否,1:是)
            is_end: 0, // 是否是终点(0:否,1:是)
            parent_point: null // 父方格
        };
        pointArray.push(point);
    }
    $("#path_map").html(blockHtml);
}

// 清除障碍物
function clearHinders() {
    if (beginSearch) {
        return;
    }
    for (var x in hinderList) {
        var p = hinderList[x];
        p.is_hinder = 0;
        $("div[index='" + p.index + "']").removeClass("hinder");
    }
    hinderList.splice(0, hinderList.length);
    $(":radio[name='pointType'][value='3']").prop("checked", "checked");
}

// 设置起点、终点和障碍物
function clickPoint(point) {
    if (beginSearch) {
        return;
    }
    var cur_point = $(point);
    var index = cur_point.attr("index");
    var pointType = $("input[type='radio'][name='pointType']:checked").val();
    if (pointType == 1) { // 起点
        // 如果已经有起点，去掉之前的起点
        for (var x in pointArray) {
            var p = pointArray[x];
            if (p.is_begin == 1) {
                p.is_begin = 0;
                $("div[index='" + p.index + "']").removeClass("begin")
                    .empty();
                break;
            }
        }
        // 将当前选择的方块设置为起点
        for (var x in pointArray) {
            var p = pointArray[x];
            if (p.index == index) {
                p.is_begin = 1;
                p.is_hinder = 0;
                p.is_end = 0;
                cur_point.removeClass("hinder").removeClass("end").addClass("begin");
                cur_point.append("<span class='endPointText'>起</span>");
                begin_point = p;
                break;
            }
        }
    } else if (pointType == 2) { // 终点
        // 如果已经有终点，去掉之前的终点
        for (var x in pointArray) {
            var p = pointArray[x];
            if (p.is_end == 1) {
                p.is_end = 0;
                $("div[index='" + p.index + "']").removeClass("end")
                    .empty();
                break;
            }
        }
        // 将当前选择的方块设置为终点
        for (var x in pointArray) {
            var p = pointArray[x];
            if (p.index == index) {
                p.is_begin = 0;
                p.is_hinder = 0;
                p.is_end = 1;
                cur_point.removeClass("hinder").removeClass("begin").addClass("end");
                cur_point.append("<span class='endPointText'>终</span>");
                end_point = p;
                break;
            }
        }
    } else if (pointType == 3) { // 障碍物
        // 将当前选择的方块设置为障碍物
        for (var x in pointArray) {
            var p = pointArray[x];
            if (p.index == index) {
                p.is_begin = 0;
                p.is_hinder = 1;
                p.is_end = 0;
                cur_point.removeClass("begin").removeClass("end").addClass("hinder");
                hinderList.push(p);
                break;
            }
        }
    }
}

// 检查是否可以开始寻路计算
function checkSearch() {
    if (begin_point == null) {
        alert("请设置起点");
        return false;
    }
    if (end_point == null) {
        alert("请设置终点");
        return false;
    }
    if (hinderList.length == 0) {
        alert("请设置障碍物");
        return false;
    }
    return true;
}

// A*寻路计算
function starSearch() {
    if (!checkSearch()) {
        return;
    }
    if (beginSearch) {
        return;
    }
    beginSearch = true;

    // 将起点放入开启列表
    openList.push(begin_point);
    var result = coreCalculate();
    if (result == 0) {
        alert("无法找到可抵达终点的路径！");
    } else if (result == 1) {
        if (end_point.parent_point == null) {
            alert("寻径计算异常！");
            return;
        }
        getEndPath();
        for (var x in pathList) {
            var p = pathList[x];
            var selected = "div[index='" + p.index + "']";
            $(selected).removeClass("begin")
                .removeClass("end")
                .removeClass("hinder")
                .addClass("path");
            $(selected).append("<span class='span_f'>" + p.f + "</span>")
                .append("<span class='span_g'>" + p.g + "</span>")
                .append("<span class='span_h'>" + p.h + "</span>");
        }

        // 显示曾进入开放列表的方块
        for (var x in pointArray) {
            var p = pointArray[x];
            var onceOpen = p.is_begin == 0 && p.is_end == 0 && p.parent_point != null && !checkPath(p);
            if (onceOpen) {
                $("div[index='" + p.index + "']").addClass("onceOpen")
                    .append("<span class='span_f onceOpenSpan'>" + p.f + "</span>")
                    .append("<span class='span_g onceOpenSpan'>" + p.g + "</span>")
                    .append("<span class='span_h onceOpenSpan'>" + p.h + "</span>");
            }
        }
    }
}

// 寻找当前开启列表中找到F值最低的方格，暂记为C。
// 将C从“开启列表”中删除，放入“关闭列表”。
// 查找C所有相邻并且可以到达 (障碍物和“关闭列表”的方格都不考虑) 的方格，
// 对于每一个可到达的方格，如果还不在“开启列表”里，将它加入 "开启列表"，计算其G，H和F值，并设置它的“父方格”为C。
// 如果已经在“开启列表”里，计算新的G值(经过C到达它的路径)，如果新的G值比原G值小，就把它的 "父方格" 改为C，再重新计算它的F值和G值
function coreCalculate() {
    if (openList.length == 0) {
        // 没有找到合适的路径
        return 0;
    }
    // 检查“开启列表”中是否已经有“终点”了，如果有，寻径计算结束
    var arrive_end = checkExist(end_point, openList);
    if (arrive_end) {
        return 1;
    }

    var lowest_f_value = 0;
    // 当前开启列表中F值最低的方格的下标
    var lowest_f_value_index = 0;
    for (var x in openList) {
        var p = openList[x];
        if (x == 0) {
            lowest_f_value = p.f;
        } else {
            if (parseFloat(lowest_f_value) > parseFloat(p.f)) {
                lowest_f_value = p.f;
                lowest_f_value_index = x;
            }
        }
    }
    var current_lowest_f_point = openList[lowest_f_value_index];
    // 将F值最低方格从“开启列表”中删除，放入“关闭列表”
    openList.splice(lowest_f_value_index, 1);
    closeList.push(current_lowest_f_point);

    var canArriveList = new Array();
    // 查找与当前F值最低方格相邻的方格，只查找上下左右四个方向
    var up_x = current_lowest_f_point.x;
    var up_y = current_lowest_f_point.y - 1;
    var right_x = current_lowest_f_point.x + 1;
    var right_y = current_lowest_f_point.y;
    var down_x = current_lowest_f_point.x;
    var down_y = current_lowest_f_point.y + 1;
    var left_x = current_lowest_f_point.x - 1;
    var left_y = current_lowest_f_point.y;
    for (var x in pointArray) {
        var p = pointArray[x];
        if ((p.x == up_x && p.y == up_y)
            || (p.x == right_x && p.y == right_y)
            || (p.x == down_x && p.y == down_y)
            || (p.x == left_x && p.y == left_y)) {
            // 理论上可抵达的方格，但不能是障碍物或在关闭列表中
            if (p.is_hinder == 0) {
                var inClose = false;
                for (var y in closeList) {
                    if (p.index == closeList[y].index) {
                        inClose = true;
                        break;
                    }
                }
                if (!inClose) {
                    canArriveList.push(p);
                }
            }
        }
    }

    for (var x in canArriveList) {
        var p = canArriveList[x];
        var inOpen = false; // 是否在“开启列表”中
        for (var y in openList) {
            if (p.index == openList[y].index) {
                inOpen = true;
                break;
            }
        }
        if (inOpen) { // 在“开启列表”中
            // 算新路径的G值
            var new_g = current_lowest_f_point.g + 10;
            if (parseInt(new_g) < parseInt(p.g)) {
                p.parent_point = current_lowest_f_point;
                p.g = new_g;
                var dx = Math.abs(p.x - end_point.x);
                var dy = Math.abs(p.y - end_point.y);
                p.h = (Math.min(dx, dy) * 0.414 + Math.max(dx, dy)).toFixed(1);
                p.f = (parseFloat(p.g) + parseFloat(p.h)).toFixed(1);
            }
        } else { // 不在“开启列表”中
            p.parent_point = current_lowest_f_point;
            p.g = current_lowest_f_point.g + 10;
            var dx = Math.abs(p.x - end_point.x);
            var dy = Math.abs(p.y - end_point.y);
            p.h = (Math.min(dx, dy) * 0.414 + Math.max(dx, dy)).toFixed(1);
            p.f = (parseFloat(p.g) + parseFloat(p.h)).toFixed(1);
            openList.push(p);
        }
    }

    return coreCalculate();
}

// 获取路径方块
function getEndPath() {
    var pathPoint = end_point.parent_point;
    do {
        pathList.push(pathPoint);
        pathPoint = pathPoint.parent_point;
    } while (pathPoint != null && pathPoint.is_begin != 1);
}

// 重新开始
function reset() {
    beginSearch = false;
    begin_point = null;
    end_point = null;
    hinderList.splice(0, hinderList.length);
    pathList.splice(0, pathList.length);
    openList.splice(0, openList.length);
    closeList.splice(0, closeList.length);
    for (var x in pointArray) {
        var p = pointArray[x];
        p.f = 0;
        p.g = 0;
        p.h = 0;
        p.is_hinder = 0;
        p.is_begin = 0;
        p.is_end = 0;
        p.parent_point = null;
        $("div[index='" + p.index + "']").removeClass("begin")
            .removeClass("end")
            .removeClass("hinder")
            .removeClass("path")
            .removeClass("onceOpen")
            .empty();
    }
    $(":radio[name='pointType'][value='1']").prop("checked", "checked");
}

function setPointType(value) {
    $(":radio[name='pointType'][value='" + value + "']").prop("checked", "checked");
}

// 检查方块是否是路径
function checkPath(point) {
    return checkExist(point, pathList);
}

// 单步执行
function oneStep() {
    if (!checkSearch()) {
        return;
    }
    if (!beginSearch) {
        beginSearch = true;
        // 将起点放入开启列表
        openList.push(begin_point);
    }

    if (openList.length == 0) {
        // 没有找到合适的路径
        alert("计算结束，无法找到可抵达终点的路径！");
        return;
    }
    // 检查“开启列表”中是否已经有“终点”了，如果有，寻径计算结束
    var arrive_end = checkExist(end_point, openList);
    if (arrive_end) {
        alert("计算结束，抵达终点！");
        return;
    }

    var lowest_f_value = 0;
    // 当前开启列表中F值最低的方格的下标
    var lowest_f_value_index = 0;
    for (var x in openList) {
        var p = openList[x];
        if (x == 0) {
            lowest_f_value = p.f;
        } else {
            if (parseFloat(lowest_f_value) > parseFloat(p.f)) {
                lowest_f_value = p.f;
                lowest_f_value_index = x;
            }
        }
    }
    var current_lowest_f_point = openList[lowest_f_value_index];
    // 将F值最低方格从“开启列表”中删除，放入“关闭列表”
    openList.splice(lowest_f_value_index, 1);
    closeList.push(current_lowest_f_point);

    var canArriveList = new Array();
    // 查找与当前F值最低方格相邻的方格，只查找上下左右四个方向
    var up_x = current_lowest_f_point.x;
    var up_y = current_lowest_f_point.y - 1;
    var right_x = current_lowest_f_point.x + 1;
    var right_y = current_lowest_f_point.y;
    var down_x = current_lowest_f_point.x;
    var down_y = current_lowest_f_point.y + 1;
    var left_x = current_lowest_f_point.x - 1;
    var left_y = current_lowest_f_point.y;
    for (var x in pointArray) {
        var p = pointArray[x];
        if ((p.x == up_x && p.y == up_y)
            || (p.x == right_x && p.y == right_y)
            || (p.x == down_x && p.y == down_y)
            || (p.x == left_x && p.y == left_y)) {
            // 理论上可抵达的方格，但不能是障碍物或在关闭列表中
            if (p.is_hinder == 0) {
                var inClose = false;
                for (var y in closeList) {
                    if (p.index == closeList[y].index) {
                        inClose = true;
                        break;
                    }
                }
                if (!inClose) {
                    canArriveList.push(p);
                }
            }
        }
    }

    for (var x in canArriveList) {
        var p = canArriveList[x];
        var inOpen = false; // 是否在“开启列表”中
        for (var y in openList) {
            if (p.index == openList[y].index) {
                inOpen = true;
                break;
            }
        }
        if (inOpen) { // 在“开启列表”中
            // 算新路径的G值
            var new_g = current_lowest_f_point.g + 10;
            if (parseInt(new_g) < parseInt(p.g)) {
                p.parent_point = current_lowest_f_point;
                p.g = new_g;
                var dx = Math.abs(p.x - end_point.x);
                var dy = Math.abs(p.y - end_point.y);
                p.h = (Math.min(dx, dy) * 0.414 + Math.max(dx, dy)).toFixed(1);
                p.f = (parseFloat(p.g) + parseFloat(p.h)).toFixed(1);
            }
        } else { // 不在“开启列表”中
            p.parent_point = current_lowest_f_point;
            p.g = current_lowest_f_point.g + 10;
            var dx = Math.abs(p.x - end_point.x);
            var dy = Math.abs(p.y - end_point.y);
            p.h = (Math.min(dx, dy) * 0.414 + Math.max(dx, dy)).toFixed(1);
            p.f = (parseFloat(p.g) + parseFloat(p.h)).toFixed(1);
            openList.push(p);
        }
    }

    // 清除起点、终点和障碍物以外的方块的显示效果
    for (var x in pointArray) {
        var p = pointArray[x];
        if (p.is_begin == 1 || p.is_end == 1 || p.is_hinder == 1) {
            continue;
        }
        $("div[index='" + p.index + "']").removeClass("begin")
            .removeClass("end")
            .removeClass("hinder")
            .removeClass("path")
            .removeClass("onceOpen")
            .empty();
    }

    // 显示当前计算出的路线
    var currentPathList = new Array();
    var pathPoint = current_lowest_f_point;
    do {
        currentPathList.push(pathPoint);
        pathPoint = pathPoint.parent_point;
    } while (pathPoint != null && pathPoint.is_begin != 1);
    for (var x in currentPathList) {
        var p = currentPathList[x];
        if(p.is_begin == 1) {
            continue;
        }
        var selected = "div[index='" + p.index + "']";
        $(selected).removeClass("begin")
            .removeClass("end")
            .removeClass("hinder")
            .addClass("path");
        $(selected).append("<span class='span_f'>" + p.f + "</span>")
            .append("<span class='span_g'>" + p.g + "</span>")
            .append("<span class='span_h'>" + p.h + "</span>");
    }

    // 显示进入“关闭列表”中的方块

    // 显示曾进入开放列表的方块
    for (var x in pointArray) {
        var p = pointArray[x];
        var onceOpen = p.is_begin == 0 && p.is_end == 0 && p.parent_point != null && !checkExist(p, currentPathList);
        if (onceOpen) {
            $("div[index='" + p.index + "']").addClass("onceOpen")
                .append("<span class='span_f onceOpenSpan'>" + p.f + "</span>")
                .append("<span class='span_g onceOpenSpan'>" + p.g + "</span>")
                .append("<span class='span_h onceOpenSpan'>" + p.h + "</span>");
        }
    }
}

// 检查方块是否在指定的集合中
function checkExist(point, array) {
    var isExist = false;
    for (var x in array) {
        var p = array[x];
        if (point.index == p.index) {
            isExist = true;
            break;
        }
    }
    return isExist;
}