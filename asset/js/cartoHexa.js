//un grand merci à https://www.redblobgames.com/grids/hexagons/
"use strict";
class cartoHexa {
    constructor(params) {
        var me = this;
        this.data = params.data ? params.data : {
            "o:id": 1,"o:title": "Carte exemple", "children":[
                {"o:id": 11,"o:title": "vide", "children":[
                    {"o:id": 111,"o:title": "encore vide"}
                    ,{"o:id": 112,"o:title": "toujours plein"}
            ]}
                ,{"o:id": 12,"o:title": "plein"}
        ]};
        this.cont = d3.select("#"+params.idCont);
        this.fontSize = params.fontSize ? params.fontSize : 1;
        this.id = params.id ? params.id : 'ch0';
        this.planExtent = params.planExtent ? params.planExtent : 16;
        this.eventCreate = params.eventCreate ? params.eventCreate : 'click';
        var layoutBase, rectCarto = me.cont.node().getBoundingClientRect(), 
        padding = 0, width = rectCarto.width, height = rectCarto.height,
        svg, rectBase, container, hierarchie, defText="vide", allHexa, takenHexa=[];

        this.init = function () {

            //layout toujours flat pour garder un coté en relation avec le parent
            layoutBase = new Layout(Layout.flat, new Point(100, 100), new Point(0, 0));

            this.cont.select('svg').remove();
            svg = this.cont.append('svg')
                .attr('id','svgCartoHexa'+me.id)
                .attr('width',width).attr('height',height),
            container = svg.append("g");
            svg.call(
                d3.zoom()
                    //.scaleExtent([.1, planExtent])
                    .on('zoom', (event) => {
                        container.attr('transform', event.transform);
                        })                        
            );
            hierarchie = d3.hierarchy(me.data);

            //initialise la cartographie suivant le nombre d'élément
            initHexa(me.planExtent);
            //ajoute les data
            addTitle(hierarchie);
            addChildren(hierarchie);
 
    };

    function ExceptionCartoHexa(message) {
        this.message = message;
        this.name = "ExceptionCartoHexa";
     }    

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
        allHexa = makeHexagonalShape(nbShape);
        let polygonVerticesFlat = layoutBase
            .polygonCorners(new Hex(0,0,0))
            .map(p=>`${p.x},${p.y}`)
            .join(" "),            
        vb = getViewBox(allHexa),
        scale = 1,
        svgHexa = container.append('svg')
            .attr('id','svgPlan0')
            .attr('width',vb[2]*scale).attr('height',vb[3]*scale)
            .attr('x',vb[0]*scale+width/2).attr('y',vb[1]*scale+height/2)
            .attr('viewBox',vb.join(' '))
            .selectAll('g').data(allHexa).enter().append('g')
            .attr('id',(h,i)=>{
                h.laysize = layoutBase.size;
                h.subShapeDetail = 1;
                h.depth = 0;
                h.id = me.id+'gPlan'+h.depth+'_'+h.q+'_'+h.r+'_'+h.s;
                return h.id;
            })
            .attr('transform',h=>hexCenter(h,layoutBase).transform)
            .on(me.eventCreate,addHexa),
        polys = svgHexa.append('polygon').attr('points',polygonVerticesFlat)
                .attr('fill','#86abcb42').attr('stroke','black')
                ;            
        return svgHexa;
    }
    //ajoute le titre de la carte
    function addTitle(d){

        let gCenter = svg.select('#'+me.id+'gPlan0_0_0_0').append('g')
            .attr('id',me.id+'gTitre')
        .attr('transform',hexCenter(new Hex(0,0,0), layoutBase).transform);
        gCenter.append("text")
            .attr('id',h=>{
                h.title = d.data['o:title'] ? d.data['o:title'] : defText; 
                d.laysize = h.laysize;
                d.subShapeDetail = h.subShapeDetail;
                d.id = h.id;
                return 'chText_'+me.id
            })
            .attr('text-anchor','middle')
            .attr('alignment-baseline',"middle")
            .text(h=>h.title)
            .attr('fill','white')
            .attr("font-size", function(){
                return (layoutBase.size.x / this.getComputedTextLength()) + 'em'
            });
        takenHexa['0_0_0_0']=gCenter;

    }
    //ajoute les efants d'un hexa
    function addChildren(d){
        if(!d.children)return;
        d.children.forEach(c=>{
            //vérifie si la donnée a une place
            let i = 1;
            while (c.q == undefined) {
                //récupère la première place disponible du centre vers l'extérieur
                hexRing(i).every(h=>{       
                    let id = d.depth==0 ? me.id : d.id;
                    id += 'gPlan'+d.depth+'_'+h.q+'_'+h.r+'_'+h.s;                
                    if(!takenHexa[id]){
                        c.q = h.q;
                        c.r = h.r;
                        c.s = h.s;
                        c.title=c.data['o:title'];
                        c.id= id;
                        c.laysize = d.laysize;
                        c.subShapeDetail = 1;
                        return false;
                    }
                    return true
                })
                i++;
                if(i > me.planExtent)throw new ExceptionCartoHexa("Plus de place disponible dans la carte");
            }
            //création de l'hexa
            addHexa(null,c);
            //création des enfants
            let layout = new Layout(Layout.flat, new Point(c.laysize.x/(c.subShapeDetail*2+1), c.laysize.y/(c.subShapeDetail*2+1)), new Point(0, 0));
            c.laysize = layout.size; 
            addChildren(c);
        })

    }


    //ajoute un hexagone
    function addHexa(e,hp){
        if(takenHexa[hp.id])return;

        let hexas = makeHexagonalShape(hp.subShapeDetail),
        layout = new Layout(Layout.flat, new Point(hp.laysize.x/(hp.subShapeDetail*2+1), hp.laysize.y/(hp.subShapeDetail*2+1)), new Point(0, 0)),
        polygonVerticesFlat = layout
            .polygonCorners(new Hex(0,0,0))
            .map(p=>`${p.x},${p.y}`)
            .join(" "),            
        s = svg.select('#'+hp.id), //n = s.node(), bb = n.getBBox(),
        gHexa = s.selectAll('g').data(hexas).enter().append('g')
            .attr('id',(h,i)=>{
                h.subShapeDetail = hp.subShapeDetail;
                h.laysize = layout.size;
                h.depth = e ? hp.depth+1 : hp.depth;//gestion ajout manuel ou data
                h.id = hp.id+'gPlan'+h.depth+'_'+h.q+'_'+h.r+'_'+h.s;    
                return h.id;
            })
        .attr('transform',h=>{
            return hexCenter(h, layout).transform
        }),
        polys = gHexa.append('polygon').attr('points',polygonVerticesFlat)
                .attr('fill','#86abcb42').attr('stroke','black').attr('stroke-width',h=>1/h.depth/10)
                .on('click',clickHex);
        //le centre est réserver à la description de l'espace
        /*        ,
        center = gHexa.append('circle').attr('x',0).attr('y',0).attr('r',10)
                .attr('fill','green').attr('stroke','black')
                .on('mouseover',addHexa);
        */        
        //ajoute les titres
        gHexa.append("text")
            .attr('id',h=>{
                if(h.q == 0 && h.r == 0 && h.r == 0)
                    h.title = hp.title ? hp.title : defText; 
                else h.title = "";
                return 'chText_'+h.id
            })
            /*
            .selectAll("tspan")
            .data(d => d.title.split(/(?=[A-Z][a-z])|\s+/g))
            .join("tspan")
            .attr("x", 0)
            .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
            */
            .attr('text-anchor','middle')
            .attr('alignment-baseline',"middle")
            .text(h=>h.title)
            .attr("font-size", adaptLabelFontSize);
        
        takenHexa[hp.id]=gHexa;

        function adaptLabelFontSize(d) {
            /*
                * The meaning of the ratio between labelAvailableWidth and labelWidth equaling 1 is that
                * the label is taking up exactly its available space.
                * With the result as `1em` the font remains the same.
                *
                * The meaning of the ratio between labelAvailableWidth and labelWidth equaling 0.5 is that
                * the label is taking up twice its available space.
                * With the result as `0.5em` the font will change to half its original size.
                */
            return (layout.size.x / this.getComputedTextLength()) + 'em';
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

  
