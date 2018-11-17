package com.astarpath.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

/**
 * Created by hejun on 2018/11/17.
 */
@Controller
public class TestController {

    /**
     * 用于测试并发量
     *
     * @return
     */
    @RequestMapping(value = "test.html", method = RequestMethod.GET)
    @ResponseBody
    public String gotoAStarSearch() {
        return "hello world";
    }
}
