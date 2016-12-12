/*!
 * jquery.reporttable. A jQuery Fixed Header/Totals/Columns tab;e
 *
 * Copyright (c) 2013 PMG Worldwide LLC, Chris Alvares
 * http://pmg.co
 *
 * Licensed under MIT
 * http://www.opensource.org/licenses/mit-license.php
 *
 *
 * Launch  : September 2013
 * Version : .1
 * Released: September 2013
 *
 *
 */
 
(function ($) {

    var ReportTable = function(container, options)
    {
        this.container = $(container);
        this.options = $.extend(true, {}, this.defaultOptions, options);    
        console.log(options);
        
        this.buildTable();
    }
    
    
    //this function will rebuild the table to be converted into a with static columns and a fixed header
    ReportTable.prototype.buildTable = function()
    {
        this.reset();
        
        this.refreshFunct = $.proxy(this.scroll, this);
        this.resizeFunct = $.proxy(this.resize, this);
        
        $(window).scroll(this.refreshFunct);        
        $(window).resize(this.resizeFunct);
    
        var scrollDefaultObject;
        console.log(this.options.scrollDefaultObject);
        if (scrollDefaultObject = this.options.scrollDefaultObject)  {
            var that = this;
            scrollDefaultObject.scroll(function() {that.scroll()});
        } else { 
            this.interval = setInterval($.proxy(this.scroll, this), this.options.pollInterval);
        }
        this.resizeInterval = setInterval($.proxy(this.resize, this), this.options.resizePollInterval);
        this.container.bind("remove", $.proxy(function(){ 
            clearInterval(this.interval);
            clearInterval(this.resizeInterval);
            $(window).unbind('scroll', this.refreshFunct);
            $(window).unbind('resize', this.resizeFunct);
            this.scroller.remove();
        }, this));      
    }
    
    ReportTable.prototype.reset = function()
    {
        if(typeof this.header !== 'undefined')
            this.header.remove();
        if(typeof this.footer !== 'undefined')
            this.footer.remove();

        this.container.find("thead, tfoot").css("visibility", "hidden");
        this.header = $("<table>")
            .addClass(this.options.cssPrefix+"_header")
            .css({
                position:"relative", 
                "z-index":4,
                "table-layout":"fixed"
            })
            .append(this.container.children("thead").clone(true))
        
        this.body = this.container.children("tbody");
        
        this.footer = $("<table>")
            .addClass(this.options.cssPrefix+"_footer")
            .css({
                position:"relative", 
                "z-index":3, 
                "margin-top":-this.container.children("tfoot").height(),
                "table-layout":"fixed"
            })
            .append(this.container.children("tfoot").clone(true));
            
        if(this.options.scrollContainer != null)
            this.createFooterScrollbar();
        
        this.container.before(this.header);
        this.container.after(this.footer);  
        
        this.header.find("thead").css("visibility", "visible");
        this.footer.find("tfoot").css("visibility", "visible");
        this.refresh();
    }
    
    ReportTable.prototype.refresh = function()
    {
        this.resize();
        this.scroll();
    }
    
    ReportTable.prototype.scroll = function()
    {
        if ($(window).scrollTop() + $(window).height() > $(document).height()) return;
        this.moveHeader();
        this.moveFooter();
    }
    
    ReportTable.prototype.moveHeader = function()
    {
        var offset = $(window).scrollTop() - this.container.offset().top + this.options.offsetHeaderHeight;
        if(offset < 0) offset = 0;
    
        this.header.css("top", offset);
    }
    
    ReportTable.prototype.moveFooter = function()
    {
        var hasScroller = typeof this.scroller !== 'undefined';
        
        var startingPosition = this.container.height() +  this.container.offset().top;
        var offset = -(startingPosition - $(window).height()) + $(window).scrollTop() - this.options.offsetFooterHeight; 
        if(hasScroller) offset -= this.scroller.height() - 2;
        
        if(offset > 0 || (offset + this.container.outerHeight()) < 0) offset = 0;
        this.footer.css("top", offset);
        
        if(hasScroller) {
            this.scroller.css("top", offset - this.scroller.height() - 2);
            this.scroller.width(this.options.scrollContainer.width());
        }
            
    }
    

    ReportTable.prototype.resize = function()
    {
        this.resizeHeader();
        this.resizeFooter();
        this.container.css("margin-top", -this.header.height());
    }   
    
    ReportTable.prototype.resizeHeader = function()
    {
        //take the first row of the table, do not use colgroup here as it is deprecated in html5
        var widths = this.getWidthsFromFirstColumn();
        var that = this;
        this.header.width(this.body.width());
        this.header.find("tr").each(function(rowCount) {
            $(this).find(that.options.headerCell).each(function(index) {
                if(index >= widths.length) return false;
                $(this).width(widths[index]);
            });
        });
        
        this.scroller.width(this.options.scrollContainer.width());
        this.scroller.find("."+this.options.cssPrefix + "_scrollbarInner").width(this.container.width());
        
    }
    
    ReportTable.prototype.resizeFooter = function()
    {
        //take the first row of the table, do not use colgroup here as it is deprecated in html5
        var widths = this.getWidthsFromFirstColumn();
        var that = this;
        this.footer.width(this.body.width());
        this.footer.find("tr").each(function(rowCount) {
            $(this).find("td").each(function(index) {
                if(index >= widths.length) return false;
                $(this).width(widths[index]);
            });
        });
    }
    
    ReportTable.prototype.createFooterScrollbar = function()
    {
        if(this.options.scrollContainer == null || typeof this.scroller !== 'undefined') {
            return; 
        }
        
        if(this.options.scrollContainer.parent().find("."+this.options.cssPrefix+"_scrollbar").length > 0) {
            this.scroller = this.options.scrollContainer.parent().find("."+this.options.cssPrefix+"_scrollbar");
            return;
        }
        this.scroller = $("<div>").addClass(this.options.cssPrefix + "_scrollbar");
        this.scroller.css({
            "position":"relative",
            "overflow-x":"auto",
            "overflow-y":"hidden",
            "z-index":6,
            "width":this.options.scrollContainer.width()
        });
        
        var innerScroll = $("<div>").addClass(this.options.cssPrefix + "_scrollbarInner");
        innerScroll.css({
            "width":this.container.width(),
            "height":0
        });
        
        this.options.scrollContainer.unbind('scroll', this.scrollContainerScrollEvent);
        this.scrollContainerScrollEvent = $.proxy(this.scrollScrollbar, this);
        this.options.scrollContainer.scroll(this.scrollContainerScrollEvent);

        innerScroll.html("&nbsp;");
        this.scroller.scroll($.proxy(this.scrollContainer, this));
        this.scroller.append(innerScroll);
        this.options.scrollContainer.after(this.scroller);
    }
    
    ReportTable.prototype.scrollContainer = function(event)
    {
        this.options.scrollContainer.scrollLeft(this.scroller.scrollLeft());
    }
    
    ReportTable.prototype.scrollScrollbar = function(event)
    {
        this.scroller.scrollLeft(this.options.scrollContainer.scrollLeft());
    }
    
    ReportTable.prototype.getWidthsFromFirstColumn = function()
    {
        var firstRow = this.body.find("tr").eq(0);

        var widths = [];
        firstRow.find("td").each(function(index) {
            widths.push($(this).width());
        });
        return widths;
    }
    
    
    ReportTable.prototype.defaultOptions = {
        offsetHeaderHeight:0,
        offsetFooterHeight:0,
        cssPrefix:"reporttable",
        pollInterval:400,
        resizePollInterval:2000,
        headerCell:"th",
        scrollContainer:null,
        scrollDefaultObject:null
    }

    $.fn.reportTable = function(options)
    {
        return this.each(function() {
            $(this).data("reportTable", new ReportTable(this, options));
        });
    }

    if (typeof define === "function" && define.amd) {
            define(["jquery"], function($) {
                    "use strict";
                    return ReportTable;
       });
    }


})(jQuery);
