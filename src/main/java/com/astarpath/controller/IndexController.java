package com.astarpath.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

/**
 * Created by hejun on 2017/10/9.
 */
@Controller
public class IndexController {

    @RequestMapping(value = "index.html", method = RequestMethod.GET)
    public String gotoAStarSearch() {
        return "astar_search";
    }
}
