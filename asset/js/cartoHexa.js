//un grand merci à https://www.redblobgames.com/grids/hexagons/
"use strict";
class cartoHexa {
    constructor(params) {
        var me = this;
        this.urlData = params.urlData ? params.urlData : false;
        this.urlDetails = params.urlDetails ? params.urlDetails : false;
        this.urlCooccurrence = params.urlCooccurrence ? params.urlCooccurrence : false;
        this.urlItems = params.urlItems ? params.urlItems : false;
        this.urlItemDetails = params.urlItemDetails ? params.urlItemDetails : false;        
        //this.urlPatience = params.urlPatience ? params.urlPatience : 'https://samszo.github.io/A_Maze_Logo/patience.html';
        this.urlPatience = params.urlPatience ? params.urlPatience : 'http://localhost/A_Maze_Logo/patience.html';        
        this.data = params.data ? params.data : {
            "o:id": 1,"o:title": "Carte exemple", "children":[
                {"o:id": 11,"o:title": "vide", "value":1, "children":[
                    {"o:id": 111,"o:title": "encore vide", "value":1}
                    ,{"o:id": 112,"o:title": "toujours plein","value":1}
            ]}
                ,{"o:id": 12,"o:title": "plein","value":10}
        ]};
        this.cont = d3.select("#"+params.idCont);
        this.fontSize = params.fontSize ? params.fontSize : 1;
        this.id = params.id ? params.id : 'ch0';
        this.planExtent = params.planExtent ? params.planExtent : 1;
        this.eventCreate = params.eventCreate ? params.eventCreate : 'click';
        this.eventDetails = params.eventDetails ? params.eventDetails : 'click';
        this.eventDetailsCooccurrence = params.eventDetailsCooccurrence ? params.eventDetailsCooccurrence : 'click';
        var layoutBase, rectCarto, padding = 0, width, height, legende,
        svg, rectBase, container, hierarchie, defText="vide", allHexa=[], takenHexa=[], color, defColor='black'
        , patience, defValSelect, valueExtent, resourceClass=false
        , onDrag=false, onZoom=false, onAdd=false, onRedim = false
        , subShapeDetail=2;

        this.init = function () {

            //initialisation
            this.cont.selectAll('div').remove();
            
            //création du div pour la légende
            let rectCont = this.cont.node().getBoundingClientRect() 
            //création du div pour la carte
            , divCarto = this.cont.append('div').attr('id','divCarto'+me.id)
                .style('height',rectCont.height+'px').style('width','70%').style('float','left')
            ; 
            //création du div pour la carto  
            legende = this.cont.append('div').attr('id','divLeg'+me.id)
                .style('height',rectCont.height+'px').style('width','30%')
                .style('background-color','white').style('float','left')

            //création du div pour la patience
            patience = this.cont.append('div').attr('id','divPatience'+me.id)
                .style('height','50%').style('width','50%')
                .style('background-color','black').style('display','none');                
            patience.append('iframe').attr('src',me.urlPatience)
                .style('position','absolute').style('top','50%').style('left','50%').style('transform','translate(-50%, -50%)')                
                .style('height','320px').style('width','206px').style('border','none').attr('scrolling','no')
                ;
            showHidePatience();

            //création du svg pour la carto
            rectCarto = divCarto.node().getBoundingClientRect(); 
            width = parseInt(rectCarto.width);
            height = parseInt(rectCarto.height);    
            svg = divCarto.append('svg')
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

            //ajoute les data
            if(me.urlData){
                d3.json(me.urlData).then(function(data) {
                    me.data = data;
                    initData();
                    showHidePatience();
                });            
            }else{
                initData();
                showHidePatience()
            } 
        };
        
    function showHidePatience(){
        if(patience.style('display')=='block')patience.style('display','none');
        else patience.style('display','block');
    }
    function initData() {
        hierarchie = d3.hierarchy(me.data);
        resourceClass = hierarchie.data['o:resource_class'];

        //définition des intervales
        valueExtent = d3.extent(me.data.children.map(d=>d.value));

        //définition des couleurs    
        color = d3.scaleSequential().domain(valueExtent).interpolator(d3.interpolateCool)

        //layout toujours flat pour garder un coté en relation avec le parent
        layoutBase = new Layout(Layout.flat, new Point(100, 100), new Point(0, 0));

        //initialise la cartographie suivant le nombre d'élément
        initHexa(me.planExtent);           
        addTitle(hierarchie);

        //création de la légende
        createLegende();

    }


    function ExceptionCartoHexa(message) {
        this.message = message;
        this.name = "ExceptionCartoHexa";
     }    

     function createLegende() {

        let pad = 10;
        legende.append('h1').text('Légende').style('padding',pad+'px');
        
        createBrushVal();

        //ajoute la liste des docs
        let lr = legende.append('div').attr('id',me.id+'ListeResource').style('padding',pad+'px');
        lr.append('h2').text("Liste des ressources");
        
    }

    function showListeDoc(d){
        let lr = d3.select('#'+me.id+'ListeResource');
        lr.selectAll('h3').remove();
        lr.append('h3').html('Cooccurences entre <i>'+d.hexa.data["o:title"]+'</i> et <i>'+d.hexaTarget.data["o:title"]+'</i>');
        lr.selectAll('ul').remove();
        let lis = lr.append('ul').selectAll('li').data(d.items).enter().append('li').text(d=>d['o:title'])
        if(me.urlItemDetails){
            lis.append('a')
                .style('margin-left','3px')
                .attr('target','_blank')
                .attr('href',l=>me.urlItemDetails+l['o:id']).text('->')
        }
    }

    function createBrushVal(){
        let margin = ({top: 20, right: 20, bottom: 30, left: 40})
        , data = d3.sort(Array.from(d3.group(me.data.children, d => d.value)).map(d=>{ return {'nb': d[1].length,'value':d[0]};}), d => d.value)
        , nbExtent = d3.extent(data, d=>d.nb)
        , rect = legende.node().getBoundingClientRect()
        , height=200 
        , focusHeight=height 
        , area = (x, y) => d3.area()
            .x(d => x(d.value))
            .y0(y(0.9))
            .y1(d => y(d.nb))
        /*
        , x = d3.scaleLinear()
            .domain(valueExtent)
            .range([margin.left, rect.width - margin.right])
        */
        , x = d3.scaleLog().base(2).domain(valueExtent).range([margin.left, rect.width - margin.right])
        , xAxis = (g, x, height, title) => g
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x))
            .call(g => g.selectAll(".title").data([title]).join("text")
                .attr("class", "title")
                .attr("x", margin.left)
                .attr("y", margin.bottom)
                .attr("fill", "currentColor")
                .attr("text-anchor", "start")
                .text(title))            
        /*
        , y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.nb)])
            .range([height - margin.bottom, margin.top])
        */
        , y = d3.scaleLog().base(2).domain([0.9,nbExtent[1]]).range([height - margin.bottom, margin.top])
        , yAxis = (g, y, title) => g
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(d3.min([4,y.domain()[1]])))
            .call(g => g.selectAll(".title").data([title]).join("text")
                .attr("class", "title")
                .attr("x", 0)
                .attr("y", 10)
                .attr("fill", "currentColor")
                .attr("text-anchor", "middle")
                .text(title));

        const svg = legende.append("svg")
            .attr("viewBox", [0, 0, rect.width, height])
            .style("display", "block");
        const brush = d3.brushX()
            .extent([[margin.left, 0.5], [rect.width - margin.right, focusHeight - margin.bottom + 0.5]])
            .on("brush", brushed)
            .on("end", brushended);
        /*la sélection par défaut correspond à une étendu de 100
        let deb = valueExtent[1] > 100 ? valueExtent[1]/2-50 : valueExtent[0], 
            fin = valueExtent[1] > 100 ? valueExtent[1]/2+50 : valueExtent[1];        
        */
        //la sélection par défaut correspond à 1/4 des valeurs les plus grandes
        let sumNb = d3.sum(data, d=>d.nb)
            , deb = data[parseInt(data.length/4)].value
            , fin = valueExtent[1];        
        defValSelect = {'v':[deb, fin],'x':[x(deb), x(fin)]};

        svg.append('defs').append("linearGradient")
            .attr("id", "gradValue")
            //.attr("gradientUnits", "userSpaceOnUse")
            //.attr("x1", 0).attr("y1", 0)
            //.attr("x2", 0).attr("y2", 1)
        .selectAll("stop")
            .data(data.map((d,i)=>{return {'offset':(i*100/data.length)+"%", 'color': color(d.value)}}))
        .enter().append("stop")
            .attr("offset", function(d) { return d.offset; })
            .attr("stop-color", function(d) { return d.color; });

        svg.append("g")
            .call(xAxis, x, height,"Nombre d'usage de l'hexa");
        svg.append("g")
            .call(yAxis, y, 'nb Hexa');
        
        svg.append("path")
            .datum(data)
            .attr("fill", "url(#gradValue)")
            .attr("d", area(x, y));
        
        const gb = svg.append("g")
            .call(brush)
            .call(brush.move, defValSelect.x);
        
        function brushed({selection}) {
            if (selection) {
                let s = selection.map(x.invert, x);
                container.selectAll('.gInitPlanOccupe').attr('visibility',h=>{
                    if(!h.data)return 'visible';
                    return h.data.value >= s[0] && h.data.value <= s[1] ? 'visible' : 'hidden'
                });
            }
        }
        
        function brushended({selection}) {
            if (!selection) {
                gb.call(brush.move, defValSelect.x);
            }else{
                let s = selection.map(x.invert, x);
                /*initialise la grille
                takenHexa = [];
                container.selectAll('.gHexa').remove();
                */
                container.style("cursor", "wait");
                addChildren(hierarchie,s);
                container.style("cursor", "default");
            }
        }

    }

    function hexCenter(hex, layout) {        
        let p = layout.hexToPixel(hex),
        x = p.x, 
        y = p.y;
        return {
            'x': x,
            'y': y,
            transform: `translate(${x},${y})`,
            points:[x,y]
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
    function initHexa(nbShape, update){
        let contTrans = container.attr('transform');
        container.attr('transform','');

        while (allHexa.length < hierarchie.children.length) {
            allHexa = makeHexagonalShape(nbShape);
            nbShape ++;
        }
        //ajoute un shape pour l'extension
        allHexa = makeHexagonalShape(nbShape);
        nbShape ++;
        me.planExtent = nbShape;
        let polygonVerticesFlat = layoutBase
            .polygonCorners(new Hex(0,0,0))
            .map(p=>`${p.x},${p.y}`)
            .join(" "),            
        vb = getViewBox(allHexa),
        scale = 1, svgHexa;
        if(update){
            svgHexa = container.select('#'+me.id+'svgPlan0');
            //traite uniquement les hexa sans data
            allHexa = allHexa.filter(h=>{
                if(h.q == 0 && h.s == 0 && h.r == 0)return false; 
                if(takenHexa[me.id+'gPlan0_'+h.q+'_'+h.r+'_'+h.s])return false;
                return true;
            })    
        }else{
            svgHexa = container.append('svg')
                .attr('id',me.id+'svgPlan0');
                //.attr('width',vb[2]*scale).attr('height',vb[3]*scale)
                //.attr('x',vb[0]*scale+width/2).attr('y',vb[1]*scale+height/2)
            //ajouter les markers pour les rapports
            let markerBoxWidth = 20
                , markerBoxHeight = 20
                , refX = markerBoxWidth/2
                , refY = markerBoxHeight/2
                , arrowPoints = [[0, 0], [0, 20], [20, 10]]
                , defs = svgHexa.append('defs');
            defs.append('marker')
                .attr('id', 'arrow')
                .attr('viewBox', [0, 0, markerBoxWidth, markerBoxHeight])
                .attr('refX', refX)
                .attr('refY', refY)
                .attr('markerWidth', markerBoxWidth)
                .attr('markerHeight', markerBoxHeight)
                .attr('orient', 'auto-start-reverse')
                .append('path')
                .attr('d', d3.line()(arrowPoints))
                .attr('fill', '#ffffff32');        
            defs.append('marker')
                .attr('id', 'point')
                .attr('viewBox', [0, 0, markerBoxWidth, markerBoxHeight])
                .attr('refX', refX)
                .attr('refY', refY)
                .attr('markerWidth', markerBoxWidth)
                .attr('markerHeight', markerBoxHeight)
                .attr('orient', 'auto')
                .append('circle')
                .attr('r', refX/2).attr('cx', refX).attr('cy', refY)
                .attr('fill', '#ffffff32');        
        }
        svgHexa.attr('viewBox',vb.join(' '));
        let gHexa = svgHexa.selectAll('.gInitPlan').data(allHexa)
        .join(
            enter => enter.append('g')
                .attr('class','gInitPlan')
                .attr('id',(h,i)=>{
                    h.layout = layoutBase;
                    h.subShapeDetail = subShapeDetail;
                    h.depth = 0;
                    h.id = me.id+'gPlan'+h.depth+'_'+h.q+'_'+h.r+'_'+h.s;
                    return h.id;
                })
                .attr('transform',h=>hexCenter(h,layoutBase).transform)
                .on(me.eventCreate,addHexa)
                .append('polygon').attr('points',polygonVerticesFlat)
                .attr('fill',defColor).attr('stroke','#a8acaf')                
            ,
            update => update
                .attr('id',(h,i)=>{
                    h.layout = layoutBase;
                    h.subShapeDetail = 2;
                    h.depth = 0;
                    h.id = me.id+'gPlan'+h.depth+'_'+h.q+'_'+h.r+'_'+h.s;
                    return h.id;
                })
                .attr('transform',h=>hexCenter(h,layoutBase).transform)
            /*    ,
            exit => exit
                .remove()
            */
          );
        //place en front les hexas occupés
        d3.selectAll('.formeSpe').raise();
        d3.selectAll('.gHexa').raise();         
        container.attr('transform',contTrans);
                
        return svgHexa;
    }
    //ajoute le titre de la carte
    function addTitle(d){

        let gCenter = svg.select('#'+me.id+'gPlan0_0_0_0')
        .attr('class','gInitPlanOccupe').append('g')
            .attr('id',me.id+'gTitre')
            .attr('transform',hexCenter(new Hex(0,0,0), layoutBase).transform);
        gCenter.append("text")
            .attr('id',h=>{
                h.title = d.data['o:title'] ? d.data['o:title'] : defText; 
                d.layout = h.layout;
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
    function addChildren(d,s){
        if(!d.children)return;
        d.children.forEach(c=>{
            //vérifie que les données sont dans la sélection
            if(c.data.value >= s[0] && c.data.value <= s[1]){ 
                addChild(d, c);
            }
        })
    }

    function addChild(d, c, move){
        //vérifie si la donnée a une place
        let i = 1, idO = c.id;
        while (c.q == undefined) {
            //récupère la première place disponible du centre vers l'extérieur
            hexRing(i).every(h=>{       
                let id = d.depth==0 ? me.id : d.id;
                id += 'gPlan'+d.depth+'_'+h.q+'_'+h.r+'_'+h.s;                
                if(!takenHexa[id]){
                    c.q = h.q;
                    c.r = h.r;
                    c.s = h.s;
                    c.depth = c.depth ? c.depth : d.depth+1;
                    c.title=c.data['o:title'];
                    c.id= id;
                    c.layout = d.layout;
                    c.subShapeDetail = subShapeDetail;
                    return false;
                }
                return true
            })
            if(i > me.planExtent)throw new ExceptionCartoHexa("Plus de place disponible dans la carte");//TODO extension automatique
            i++;
        }
        //vérifie si on place le concept à l'intérieur
        if(move){
            c.depth++;
            //création de l'hexa
            addHexa(null,c);
            d3.select('#'+idO).remove();            
            d3.select('#'+c.id).raise();
            takenHexa[idO]=false;
        }else{
            //création de l'hexa
            addHexa(null,c);
        }
        //création des enfants
        let layout = new Layout(Layout.flat, new Point(c.layout.size.x/(c.subShapeDetail*2+1), c.layout.size.y/(c.subShapeDetail*2+1)), new Point(0, 0));
        c.layout = layout; 
        addChildren(c,[0,me.data.children.length]);

        return c;
        
    }

    //ajoute un hexagone
    function addHexa(e,hp){
        if(hp.q == 0 && hp.s == 0 && hp.r == 0)return;
        if(takenHexa[hp.id])return;

        let hexas = makeHexagonalShape(hp.subShapeDetail),
        layout = new Layout(Layout.flat, new Point(hp.layout.size.x/(hp.subShapeDetail*2+1), hp.layout.size.y/(hp.subShapeDetail*2+1)), new Point(0, 0)),
        polygonVerticesFlat = layout
            .polygonCorners(new Hex(0,0,0))
            .map(p=>`${p.x},${p.y}`)
            .join(" "),            
        s = svg.select('#'+hp.id),
        sClass = s.attr('class'),
        //ajoute la forme spécifique
        formeSpe = addFormeSpe(e, s,hp),    
        //ajoute la grille hexagonale
        gHexa = s.selectAll('.gHexa').data(hexas).enter().append('g')
            .attr('class',h=>{
                h.depth = e ? hp.depth+1 : hp.depth;//gestion ajout manuel ou data
                return 'gHexa depth'+h.depth
            })
            .attr('id',(h,i)=>{
                h.data = hp.data;
                h.center = hexCenter(h, layout);
                h.subShapeDetail = hp.subShapeDetail;
                h.layout =layout;                
                h.id = hp.id+'gPlan'+h.depth+'_'+h.q+'_'+h.r+'_'+h.s;    
                return h.id;
            })
            .attr('transform',h=>{
                return h.center.transform
            })
            .on("mouseenter", zoomHexa)
            .on("mouseleave", dezoomHexa)
            ,
        polys = gHexa.append('polygon').attr('points',polygonVerticesFlat)
            .attr('fill',h=>{
                let c = h.data ? color(h.data.value) : 'white';
                if(h.q == 0 && h.s == 0 && h.r == 0) h.color = d3.color(c).copy({opacity: resourceClass ? 0.01 : 0.8});
                else h.color = d3.color(c).copy({opacity: resourceClass ? 0.01 : 0.5});
                return h.color
            })
            .attr('stroke',resourceClass ? 'white' : 'black')
            .attr('stroke-width',h=>1/h.depth/10)
            .style('cursor', h=>getCursor(h))
            .on("mouseenter", function(){onAdd=true;})
            .on("mouseleave", function(){onAdd=false;})
            .on('click',clickHexa);
        polys.call(d3.drag()
            .on("start", redimHexaStart)
            .on("drag", redimHexa)
            .on("end", redimHexaEnd)
            //.filter(event => !onZoom && !onAdd)
            );
        //ajoute le drag & drop sur l'hexa
        s.attr('class',sClass=='gInitPlan' ? 'gInitPlanOccupe' : sClass+' gInitPlanOccupe')
            .style('cursor', 'grab')
            .data(hp).call(d3.drag()
            .on("start", dragHexaStart)
            .on("drag", dragHexa)
            .on("end", dragHexaEnd)
            .filter(event => !onZoom && !onAdd && !onRedim)
            //.on("start.update drag.update end.update", dragHexaUpdate)
        );                        

        //le centre est réserver à la description de l'espace
        //ajoute les titres
        gHexa.append("text")
            .attr('id',h=>{
                if(h.q == 0 && h.s == 0 && h.r == 0)
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
            .attr("font-size", adaptLabelFontSize)
            .style('cursor', 'help')
            .on(me.eventDetails ,getDetails)
            ;

        takenHexa[hp.id]=gHexa;

    }
    function getCursor(h){
        let d = h.distance({q:0,s:0,r:0});
        switch (d) {
            case 0://au centre
                return 'pointer';
                break;
            case 1://à l'intérieur
                return 'zoom-in';
                break;        
            case 2://au bord
                if(h.q==0 && h.s==2 && h.r==-2)return 'n-resize';
                if(h.q==2 && h.s==-1 && h.r==-1)return 'e-resize';
                if(h.q==0 && h.s==-2 && h.r==2)return 's-resize';
                if(h.q==-2 && h.s==1 && h.r==1)return 'w-resize';
                if(h.q==1 && h.s==1 && h.r==-2)return 'ne-resize';
                if(h.q==2 && h.s==0 && h.r==-2)return 'ne-resize';
                if(h.q==-1 && h.s==2 && h.r==-1)return 'nw-resize';
                if(h.q==-2 && h.s==2 && h.r==0)return 'nw-resize';
                if(h.q==2 && h.s==-2 && h.r==0)return 'se-resize';
                if(h.q==1 && h.s==-2 && h.r==1)return 'se-resize';
                if(h.q==-1 && h.s==-1 && h.r==2)return 'sw-resize';
                if(h.q==-2 && h.s==0 && h.r==2)return 'sw-resize';
                break;
        }
    }
    function addFormeSpe(e, s,hp){
        switch (resourceClass) {
            case "jdc:Concept":
                return addConcept(e, s,hp);                
                break;        
            default:
                return false;
        }
    }
    function addConcept(e, s,hp){
        let forme = s.selectAll('circle').data([hp]).enter().append('g')
            .attr('class',h=>'formeSpe depth'+ (e ?  h.depth+1 : h.depth))
        ;
        //ajoute le cercle inscrit
        forme.append('circle')
            .attr('fill',h=>{
                let c = h.data ? color(h.data.value) : 'white';
                h.color = d3.color(c).copy({opacity: 0.8});
                return h.color
            })
            .attr('cx',0)
            .attr('cy',0)
            .attr('r',h=>h.layout.size.x*Math.sqrt(3)/2)//rayon du cercle inscrit
            .attr('stroke','black').attr('stroke-width',h=>1/h.depth/10);       
        //ajoute le cercle du bord pour redimensionner
        forme.append('circle')
            .attr('fill',h=>{
                let c = h.data ? color(h.data.value) : 'white';
                h.color = d3.color(c).copy({opacity: 0.8});
                return h.color
            })
            .attr('cx',0)
            .attr('cy',0)
            //rayon du cercle circonscrit de 2 hexa
            .attr('r',h=>((h.layout.size.x/(h.subShapeDetail*2+1))*Math.sqrt(3)/2)*3)
            .attr('stroke','black').attr('stroke-width',h=>1/h.depth/10)
            .style('pointer','nwse-resize');       
        
        return forme;
    }
    function dragHexa(e,h){
        d3.select(this).raise().attr("transform",'translate('+(e.x)+','+(e.y)+')')
    }
    function dragHexaStart(e,h){        
        onDrag=true;
        hideCooccurrences(h);
        d3.select(this).attr('stroke','white').attr('stroke-width',h=>1/h.depth);
    }
    function dragHexaEnd(e,h){
        let nh = h.parent.layout.pixelToHex(e);
        nh.q = Math.round(nh.q); 
        nh.r = Math.round(nh.r); 
        nh.s = Math.round(nh.s);
        let sum = nh.q+nh.r+nh.s;
        if(nh.q+nh.r+nh.s!=0)nh.s = -nh.q - nh.r;
        //vérifie si l'hexa est occupé
        let existHexa = d3.select('#'+me.id+'gPlan'+(h.depth-1)+'_'+nh.q+'_'+nh.r+'_'+nh.s);
        //vérifie s'il faut ajouter l'hexa dans un autre hexa
        if(existHexa.size() && existHexa.datum() && existHexa.datum().data){
            //un parent ne pas pas être enfant
            if(existHexa.datum().data['o:id']==h.data['o:id']){
                let center = hexCenter(nh, h.parent.layout);
                d3.select(this)
                    .attr("transform",'translate('+(center.x)+','+(center.y)+')')
                    .attr('stroke','black').attr('stroke-width',h=>1/h.depth/10);
            }else{
                h.q=null
                addChild(existHexa.datum(),h,true);    
            }
        }else{
            let center = hexCenter(nh, h.parent.layout);
            d3.select(this)
                .attr("transform",'translate('+(center.x)+','+(center.y)+')')
                .attr('stroke','black').attr('stroke-width',h=>1/h.depth/10);
            //création d'un pavage supplémentaire
            if(!existHexa.size()){
                //ajoute les hexas supplémentaires pour la grille
                let dst = nh.distance({q:0,r:0,s:0});
                initHexa(dst,true);
            }
        }
        showCooccurrences(h);    
        onDrag=false;
    }
    function dragHexaUpdate(e,h){
        console.log(h);
    }

    function redimHexa(e,h){
        console.log(h);
    }
    function redimHexaStart(e,h){        
        onRedim=true;
        console.log(h);
    }
    function redimHexaEnd(e,h){
        console.log(h);
        onRedim=false;
    }
    function redimHexaUpdate(e,h){
        console.log(h);
    }


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
        return (d.layout.size.x / this.getComputedTextLength()) + 'em';
    } 

    function zoomHexa(e,d){ 
        if(!onDrag && d.q == 0 && d.r == 0 && d.r == 0 && d.layout){
            onZoom = true;
            let pn = d3.select(this.parentNode)
            pn.raise();
            pn.select('.formeSpe.depth'+d.depth).raise().attr('transform','scale(5)');
            pn.selectAll('.gHexa.depth'+d.depth).raise();
            d3.select(this).raise().attr('transform','scale(10)');
        }
    }
    function dezoomHexa(e,d){
        if(d.q == 0 && d.r == 0 && d.r == 0 && d.layout){
            d3.select(this.parentNode).select('.formeSpe.depth'+d.depth).attr('transform','');
            d3.select(this).attr('transform',hexCenter(d, d.layout).transform);
            d3.select(this).selectAll('g').raise();
            onZoom = false;
        }
    }

    function getDetails(e,d){
        if(!d.details){
            if(me.urlDetails && d.data && d.q == 0 && d.r == 0 && d.r == 0){
                let h = d3.select(this);
                h.style('cursor','wait');
                d3.json(me.urlDetails+d.data["o:id"]).then(function(data) {
                    d.details = data;
                    if(me.urlCooccurrence){
                        d3.json(me.urlCooccurrence+d.data["o:id"]).then(function(data) {
                            d.cooccurrences = data;
                            showCooccurrences(d);
                        });                    
                    }
                    h.style('cursor','pointer');
                    showDetails(d);
                });            
            }
        }else{
            if(d.showDetails){
                hideDetails(d);
                hideCooccurrences(d);    
            }else{
                showDetails(d);
                showCooccurrences(d);    
            }
        }

    }
    function showDetails(d){
        //d3.select('#'+d.id).select('polygon').attr('stroke','white').attr('stroke-width', d.depth)
        d.showDetails = true;
    }
    function hideDetails(d){
        //d3.select('#'+d.id).attr('stroke','black').attr('stroke-width', 1/d.depth/10)
        d.showDetails = false;
    }
    function hideCooccurrences(d){
        container.selectAll('.cooccurrences'+d.data["o:id"]).remove();
    }
    function showCooccurrences(d){      
        if(!d.cooccurrences)return;
        //gestion du zoom
        let contTrans = container.attr('transform');
        container.attr('transform','');
        let links = d.cooccurrences.filter(c=>{
                if(c.id==d.data["o:id"])return false;
                c.hexaTarget = getHexaFromId(c.id);
                c.hexa = d;
                c.resources = c.idsR.split(',');
                return c.hexaTarget;
                })
            , extent = d3.extent(links,l=>l.nbValue)
            , rapportWidth = d3.scaleLinear()
                .domain(extent)
                .range([1, d.layout.size.x])
            , bbT, bb = d3.select('#'+d.id).node().getBoundingClientRect()
            ,rapports = container.selectAll('.cooccurrences'+d.data["o:id"])
                .data(links)
                .enter().append('g')
                    .attr('class','cooccurrences'+d.data["o:id"])
                    .attr('id',r=>{
                        bbT = d3.select('#'+r.hexaTarget.id).node().getBoundingClientRect();
                        r.points = [
                            [bb.x+bb.width/2,bb.y+bb.height/2],
                            [bbT.x+bbT.width/2,bbT.y+bbT.height/2]
                        ]
                        return 'rapport'+d.data["o:id"]+'_'+r.id;
                    })
                    .on(me.eventDetailsCooccurrence,showDetailsCooccurrences)
                    .style('cursor','pointer')
                    ;
        rapports.append('path')
            .attr('d', r=>d3.line()(r.points))
            .attr('stroke', '#ffffff32')
            .attr('stroke-width', r=>rapportWidth(r.nbValue))
            //.attr('marker-start', 'url(#point')
            .attr('marker-end', 'url(#point)')
            .attr('stroke-linecap',"round")
            .attr('fill', 'none');
        
        container.attr('transform', contTrans);        
    }
    function showDetailsCooccurrences(e,d){
        if(d.items){
            showListeDoc(d);
        }else{
            //récupère la liste des ressources
            if(me.urlItems){
                d3.json(me.urlItems+'&ids[]='+d.resources.join('&ids[]=')).then(function(data) {
                    d.items = data;
                    showListeDoc(d);
                });                    
            }
        }
    }
    function getHexaFromId(id){
        let hexa = hierarchie.find(h=>{
            return h.data['o:id']==id
        });
        if(hexa){
            if(hexa.layout)return hexa;
            else{
                return false;
                //hexa.layout = layoutBase
                //return addChild(hexa.parent,hexa);
            } 
        }else{
            //throw new ExceptionCartoHexa("L'hexagone n'existe pas dans la carte");
            //console.log("L'hexagone n'existe pas dans la carte : "+id);
            return false;
        } 

    }
    function updateHexa(e,d){
        console.log(d);
    }
    function clickHexa(e,h){
        let d = h.distance({q:0,s:0,r:0});
        if(h.q == 0 && h.s == 0 && h.r == 0) updateHexa(e,h);
        else if(d==1)addHexa(e,h);
    }

    
    this.init();
    
    }
}

  
