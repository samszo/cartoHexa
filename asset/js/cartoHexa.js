"use strict";
class cartoHexa {
    constructor(params) {
        var me = this;
        this.data = params.data ? params.data : {"children":[
            {"id": 1,"o:title": "vide", "value":1}
            ,{"id": 2,"o:title": "plein", "value":1}
        ]};
        this.cont = d3.select("#"+params.idCont);
        this.fontSize = params.fontSize ? params.fontSize : 1;
        this.id = params.id ? params.id : 'ch0';
        this.planExtent = params.planExtent ? params.planExtent : 64;
        this.eventCreate = params.eventCreate ? params.eventCreate : 'click';
        var layoutBase, rectCarto = me.cont.node().getBoundingClientRect(), 
        padding = 0, width = rectCarto.width, height = rectCarto.height,
        svg, rectBase, container, hierarchie, defText="le vide c'est bien";

        this.init = function () {

            //layout toujours flat pour garder un coté en relation avec le parent
            layoutBase = new Layout(Layout.flat, new Point(100, 100), new Point(0, 0));

            this.cont.select('svg').remove();
            svg = this.cont.append('svg')
                .attr('id','svgCartoHexa'+me.id)
                .attr('width',width).attr('height',height)
                ,//.attr('viewBox',vb.join(' ')),
            container = svg.append("g");
            svg.call(
                d3.zoom()
                    //.scaleExtent([.1, planExtent])
                    .on('zoom', (event) => {
                        container.attr('transform', event.transform);
                        })                        
            );
            hierarchie = d3.hierarchy(me.data);

            //initialise l'espace conceptuel suivant le nombre de concept
            initHexa(me.planExtent);
 
    };

    function hexCenter(hex, layout) {        
        let p = layout.hexToPixel(hex),
        x = p.x, 
        y = p.y;
        return {
            'x': x,
            'y': y,
            transform: `translate(${x},${y})`,
        }
    }
    function getViewBox(hexas) {
        let rect = hexSetBounds(layoutBase, hexas),
        left = rect.left - padding,
        top = rect.top - padding,
        width = rect.right - rect.left + 2 * padding,
        height = rect.bottom - rect.top + 2 * padding;
        return [left, top, width, height];
    }
    //création de la grille vide
    function initHexa(nbShape){
        let hexas = makeHexagonalShape(nbShape),
        polygonVerticesFlat = layoutBase
            .polygonCorners(new Hex(0,0,0))
            .map(p=>`${p.x},${p.y}`)
            .join(" "),            
        vb = getViewBox(hexas),
        svgHexa = container.append('svg')
            .attr('id','svgPlan0')
            .attr('width',width*nbShape).attr('height',height*nbShape)
            .attr('x',-width*nbShape/2-layoutBase.size.x).attr('y',-height*nbShape/2-layoutBase.size.y)
            .attr('viewBox',vb.join(' '))
            .selectAll('g').data(hexas).enter().append('g')
            .attr('id',(h,i)=>{
                h.laysize = layoutBase.size;
                h.subShapeDetail = 1;
                h.niv = 0;
                h.id = me.id+'gPlan'+h.niv+'_'+h.q+'_'+h.r+'_'+h.s;
                h.idSvg = me.id+'svgPlan0';
                return h.id;
            })
            .attr('transform',h=>hexCenter(h,layoutBase).transform)
            .on(me.eventCreate,addHexa),
        polys = svgHexa.append('polygon').attr('points',polygonVerticesFlat)
                .attr('fill','#86abcb42').attr('stroke','black')
                ;            
        return svgHexa;
    }

    function addHexa(e,d){
        let hexas = makeHexagonalShape(d.subShapeDetail),
        layout = new Layout(Layout.flat, new Point(d.laysize.x/(d.subShapeDetail*2+1), d.laysize.y/(d.subShapeDetail*2+1)), new Point(0, 0)),
        labelAvailableWidth = layout.size.x,
        polygonVerticesFlat = layout
            .polygonCorners(new Hex(0,0,0))
            .map(p=>`${p.x},${p.y}`)
            .join(" "),            
        s = svg.select('#'+d.id), n = s.node(), bb = n.getBBox(),
        gCpt = s.selectAll('g').data(hexas).enter().append('g')
            .attr('id',(h,i)=>{
                h.subShapeDetail = d.subShapeDetail;
                h.laysize = layout.size;
                h.niv = d.niv+1;
                h.id = d.id+'gPlan'+h.niv+'_'+h.q+'_'+h.r+'_'+h.s;
                return h.id;
            })
        .attr('transform',h=>{
            return hexCenter(h, layout).transform
        }),
        polys = gCpt.append('polygon').attr('points',polygonVerticesFlat)
                .attr('fill','#86abcb42').attr('stroke','black').attr('stroke-width',h=>1/h.niv/3)
                .on('click',clickHex);
        //le centre est réserver à la description de l'espace
        /*        ,
        center = gCpt.append('circle').attr('x',0).attr('y',0).attr('r',10)
                .attr('fill','green').attr('stroke','black')
                .on('mouseover',addHexa);
        */        
        //ajoute les titres
        gCpt.append("text")
            .attr('id',d=>{
                if(d.q == 0 && d.r == 0 && d.r == 0)
                    d.title = d['o:title'] ? d['o:title'] : defText; 
                else d.title = "";
                return 'chText_'+d.id
            })
            //
            .selectAll("tspan")
            .data(d => d.title.split(/(?=[A-Z][a-z])|\s+/g))
            .join("tspan")
            .attr("x", 0)
            .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
            //
            .attr('text-anchor','middle')
            //.text(d=>d.title)
            .attr("font-size", adaptLabelFontSize)
            ;

        function adaptLabelFontSize(d) {
            let labelWidth =  this.getComputedTextLength();
            
            // There is enough space for the label so leave it as is.
            if (labelWidth < labelAvailableWidth) {
                return null;
            }
            /*
                * The meaning of the ratio between labelAvailableWidth and labelWidth equaling 1 is that
                * the label is taking up exactly its available space.
                * With the result as `1em` the font remains the same.
                *
                * The meaning of the ratio between labelAvailableWidth and labelWidth equaling 0.5 is that
                * the label is taking up twice its available space.
                * With the result as `0.5em` the font will change to half its original size.
                */
            return (labelAvailableWidth / labelWidth) + 'em';
        } 

    }
   
    function updateHexa(e,d){
        console.log(d);
    }
    function clickHex(e,h){
        if(h.q == 0 && h.r == 0 && h.r == 0) updateHexa(e,h);
        else addHexa(e,h);
    }

    
    this.init();
    
    }
}

  
