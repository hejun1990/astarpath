package com.astarpath.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Created by hejun on 2017/10/9.
 */
@Controller
public class IndexpageController {
    @RequestMapping("/index.html")
    public String gotoAStarSearch() {
        return "astar_search";
    }
}
