// # Quintus platformer example
//
// [Run the example](../quintus/examples/platformer/index.html)
// WARNING: this game must be run from a non-file:// url
// as it loads a level json file.
//
// This is the example from the website homepage, it consists
// a simple, non-animated platformer with some enemies and a 
// target for the player.
var global_rice_count = 0;
var global_sushi_count = 0;
var global_seaweed_count = 0;
var global_sushi_obtained_count = 0;
var global_holy_shit = false;
var global_current_level = 1
var global_goal = false;
window.addEventListener("load",function() {

// Set up an instance of the Quintus engine  and include
// the Sprites, Scenes, Input and 2D module. The 2D module
// includes the `TileLayer` class as well as the `2d` componet.
var Q = window.Q = Quintus({audioSupported: [ 'wav','mp3','ogg' ]})
        .include("Sprites, Scenes, Input, 2D, Anim, Touch, UI, TMX, Audio")
        // Maximize this game to whatever the size of the browser is
        .setup({ maximize: false,
                  width:   800, // Set the default width to 800 pixels
                  height:  600, // Set the default height to 600 pixels
                  upsampleWidth:  800,  // Double the pixel density of the 
                  upsampleHeight: 600,  // game if the w or h is 420x320
                        // or smaller (useful for retina phones)
                  downsampleWidth: 1024, // Halve the pixel density if resolution
                  downsampleHeight: 768
        })
        // And turn on default input controls and touch input (for UI)
        .controls(true).touch()
        // Enable sounds.
        .enableSound();

// Load and init audio files.
Q.gravityY = 9.8*250;

//Q.audio.play("dota2.mp3",{ loop: true });

Q.SPRITE_PLAYER = 1;
Q.SPRITE_COLLECTABLE = 2;
Q.SPRITE_ENEMY = 4;
Q.SPRITE_DOOR = 8;

Q.Sprite.extend("PlayerStrip",{

  init: function(p) {

    this._super(p, {
      sheet: "playerstrip",
      sprite: "playerstrip",
      direction: "right",
      standingPoints: [ [ -16, -44], [ -23, 70 ], [23,70], [ 16, -44 ]],
      duckingPoints: [ [ -16, -44], [ -23, 70 ], [23,70], [ 16, -44 ]],
      jumpSpeed: -1000,
      gravity: 100,
      speed: 150,
      strength: 100,
      score: 0,
      rice_count: 0,
      seaweed_count: 0,
      acceleration: 20,
      sushi_list: [],
      scale: 1,
      holy_shit: false,
      status_effects: [],
      type: Q.SPRITE_PLAYER,
      collisionMask: Q.SPRITE_DEFAULT | Q.SPRITE_DOOR | Q.SPRITE_COLLECTABLE
    });

    this.p.points = this.p.standingPoints;

    this.add('2d, platformerControls, animation, tween');

    this.on("bump.top","breakTile");

    this.on("sensor.tile","checkLadder");
    this.on("enemy.hit","enemyHit");
    this.on("jump");
    this.on("jumped");

    Q.input.on("down",this,"checkDoor");
  },

  jump: function(obj) {
    // Only play sound once.
    if (!obj.p.playedJump) {
      Q.audio.play('jump.mp3');
      obj.p.playedJump = true;
    }
  },

  jumped: function(obj) {
    obj.p.playedJump = false;
  },

  checkLadder: function(colObj) {
    if(colObj.p.ladder) { 
      this.p.onLadder = true;
      this.p.ladderX = colObj.p.x;
    }
  },

  checkDoor: function() {
    this.p.checkDoor = true;
  },

  resetLevel: function() {
    Q.stageScene("level"+global_current_level);
    this.p.strength = 100;
    this.animate({opacity: 1});
    Q.stageScene('hud', 3, this.p);
    global_holy_shit = false;
  },

  enemyHit: function(data) {
    var col = data.col;
    var enemy = data.enemy;
    this.p.vy = -150;
    if (col.normalX == 1) {
      // Hit from left.
      this.p.x -=15;
      this.p.y -=15;
    }
    else {
      // Hit from right;
      this.p.x +=15;
      this.p.y -=15;
    }
    this.p.immune = true;
    this.p.immuneTimer = 0;
    this.p.immuneOpacity = 1;
    this.p.strength -= 25;
    Q.stageScene('hud', 3, this.p);
    if (this.p.strength == 0) {
      this.resetLevel();
    }
  },

  continueOverSensor: function() {
    this.p.vy = 0;
    if(this.p.vx != 0) {
      this.play("walk_" + this.p.direction);
    } else {
      this.play("stand_" + this.p.direction);
    }
  },

  breakTile: function(col) {
    if(col.obj.isA("TileLayer")) {
      if(col.tile == 24) { col.obj.setTile(col.tileX,col.tileY, 36); }
      else if(col.tile == 36) { col.obj.setTile(col.tileX,col.tileY, 24); }
    }
    Q.audio.play('coin.mp3');
  },

  step: function(dt) {
    
    var processed = false;
    if (this.p.rice_count > 0 && this.p.seaweed_count > 0 && this.p.sushi_list.length > 0) {

      var sushi_type = this.p.sushi_list.pop();
      this.p.rice_count = this.p.rice_count - 1;
      global_rice_count -= 1;
      global_sushi_count -= 1;
      global_seaweed_count -= 1;
      global_sushi_obtained_count += 1;
      this.p.seaweed_count = this.p.seaweed_count - 1;
      global_goal = true;
       switch(sushi_type) {
        // do the effect and push onto status_effects
        case "red_fish":
          //console.log("hello", this.p.rice_count, this.p.sushi_list.length);
          this.p.scale += 2;
          this.p.status_effects.push([1,4]);
          break;
        case "blue_fish":
          this.p.reverseControls = true;
          this.p.status_effects.push([2,3]);
        case "orange_fish":
          this.p.jumpSpeed -= 600;
          this.p.maxJumps += 2;
          this.p.status_effects.push([3,4]);
        case "pink_fish":
          this.p.scale *= 0.3;
          this.p.status_effects.push([4,4]);
        case "green_fish":
          this.p.angle += 180;
          this.p.status_effects.push([5,10]);
        case "yellow_fish":
          console.log("..");
          global_holy_shit = true;
          this.p.status_effects.push([6,10]);
      }
    }

    for (var i = this.p.status_effects.length - 1; i >= 0; i--) {
      var list = this.p.status_effects[i];
      var effect = list[0]
      
      var len = list[1];
      if (len <= 0) {
        this.p.status_effects.splice(i, 1);
        // undo the effect
        switch(effect) {
          case 1:
            this.p.scale -= 2;
            break;
          case 2:
            this.p.reverseControls = false;
            break;
          case 3:
            this.p.jumpSpeed += 600;
            this.p.maxJumps -= 2;
            break;
          case 4:
            this.p.scale *= 3;
            break;
          case 5:
            this.p.angle -= 180;
            break;
          case 6:
            global_holy_shit = false;
            break;

        } 
      } else {
        //console.log(len);
        this.p.status_effects[i] = [effect, len-dt];
      }
    }

    if (this.p.immune) {
      // Swing the sprite opacity between 50 and 100% percent when immune.
      if ((this.p.immuneTimer % 12) == 0) {
        var opacity = (this.p.immuneOpacity == 1 ? 0 : 1);
        this.animate({"opacity":opacity}, 0);
        this.p.immuneOpacity = opacity;
      }
      this.p.immuneTimer++;
      if (this.p.immuneTimer > 144) {
        // 3 seconds expired, remove immunity.
        this.p.immune = false;
        this.animate({"opacity": 1}, 1);
      }
    }

    if(this.p.onLadder) {
      this.p.gravity = 0;

      if(Q.inputs['up']) {
        this.p.vy = -this.p.speed;
        this.p.x = this.p.ladderX;
        this.play("climb");
      } else if(Q.inputs['down']) {
        this.p.vy = this.p.speed;
        this.p.x = this.p.ladderX;
        this.play("climb");
      } else {
        this.continueOverSensor();
      }
      processed = true;
    } 
      
    if(!processed && this.p.door) {
      this.p.gravity = 1;
      if(this.p.checkDoor && this.p.landed > 0) {
        // Enter door.
        this.p.y = this.p.door.p.y;
        this.p.x = this.p.door.p.x;
        this.play('climb');
        this.p.toDoor = this.p.door.findLinkedDoor();
        processed = true;
      }
      else if (this.p.toDoor) {
        // Transport to matching door.
        this.p.y = this.p.toDoor.p.y;
        this.p.x = this.p.toDoor.p.x;
        this.stage.centerOn(this.p.x, this.p.y);
        this.p.toDoor = false;
        this.stage.follow(this);
        processed = true;
      }
    } 
      
    if(!processed) { 
      this.p.gravity = 1;

      if(Q.inputs['down'] && !this.p.door) {
        this.p.ignoreControls = true;
        this.play("duck_" + this.p.direction);
        if(this.p.landed > 0) {
          this.p.vx = this.p.vx * (1 - dt*2);
        }
        this.p.points = this.p.duckingPoints;
      } else {
        this.p.ignoreControls = false;
        this.p.points = this.p.standingPoints;

        if(this.p.vx > 0) {
          if(this.p.landed > 0) {
            this.play("walk_right");
          } else {
            this.play("jump_right");
          }
          this.p.direction = "right";
        } else if(this.p.vx < 0) {
          if(this.p.landed > 0) {
            this.play("walk_left");
          } else {
            this.play("jump_left");
          }
          this.p.direction = "left";
        } else {
          this.play("stand_" + this.p.direction);
        }
           
      }
    }

    this.p.onLadder = false;
    this.p.door = false;
    this.p.checkDoor = false;


    if(this.p.y > 1000) {
      this.stage.unfollow();
    }

    if(this.p.y > 2000) {
      this.resetLevel();
    }
  }
});


Q.Sprite.extend("Enemy", {
  init: function(p,defaults) {

    this._super(p,Q._defaults(defaults||{},{
      sheet: p.sprite,
      vx: 50,
      defaultDirection: 'left',
      type: Q.SPRITE_ENEMY,
      collisionMask: Q.SPRITE_DEFAULT
    }));

    this.add("2d, aiBounce, animation");
    this.on("bump.top",this,"die");
    this.on("hit.sprite",this,"hit");
  },

  step: function(dt) {
    if (global_holy_shit) {
      this.p.angle += 10;
    }
    if(this.p.dead) {
      this.del('2d, aiBounce');
      this.p.deadTimer++;
      if (this.p.deadTimer > 24) {
        // Dead for 24 frames, remove it.
        this.destroy();
      }
      return;
    }
    var p = this.p;

    p.vx += p.ax * dt;
    p.vy += p.ay * dt;

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    this.play('walk');
  },

  hit: function(col) {
    if(col.obj.isA("PlayerStrip") && !col.obj.p.immune && !this.p.dead) {
      col.obj.trigger('enemy.hit', {"enemy":this,"col":col});
      Q.audio.play('hit.mp3');
    }
  },

  die: function(col) {
    if(col.obj.isA("PlayerStrip")) {
      Q.audio.play('coin.mp3');
      this.p.vx=this.p.vy=0;
      this.play('dead');
      this.p.dead = true;
      var that = this;
      col.obj.p.vy = -300;
      this.p.deadTimer = 0;
    }
  }
});

Q.Enemy.extend("Fly", {

});

Q.Enemy.extend("Slime", {
  init: function(p) {
    this._super(p,{
      w: 55,
      h: 34
    });
  }
});

Q.Enemy.extend("Snail", {
  init: function(p) {
    this._super(p,{
      scale: 0.3,
    });
  }

});


Q.Sprite.extend("Collectable", {
  init: function(p) {
    this._super(p,{
      sheet: p.sprite,
      type: Q.SPRITE_COLLECTABLE,
      collisionMask: Q.SPRITE_PLAYER,
      sensor: true,
      vx: 0,
      vy: 0,
      gravity: 0
    });
    this.add("animation");

    this.on("sensor");
  },

  // When a Collectable is hit.
  sensor: function(colObj) {
    // Increment the score.
    if (this.p.amount) {
      colObj.p.score += this.p.amount;
      Q.stageScene('hud', 3, colObj.p);
    }
    Q.audio.play('coin.mp3');
    this.destroy();
  }, 
  step: function(dt) {
    if (global_holy_shit) {
      this.p.angle += 10;
    }
  }
});

Q.Sprite.extend("Door", {
  init: function(p) {
    this._super(p,{
      sheet: p.sprite,
      type: Q.SPRITE_DOOR,
      collisionMask: Q.SPRITE_NONE,
      sensor: true,
      vx: 0,
      vy: 0,
      gravity: 0
    });
    this.add("animation");

    this.on("sensor");
  },
  findLinkedDoor: function() {
    return this.stage.find(this.p.link);
  },
  // When the player is in the door.
  sensor: function(colObj) {
    // Mark the door object on the player.
    colObj.p.door = this;
  }
});

Q.Sprite.extend("Goal", {
  init: function(p) {
    this._super(p, {
      sensor: true,
      sheet: p.sprite,
    });
    this.on("sensor");
  },
  sensor: function(colObj) {
    this.p.sensor = false;
    if (global_goal = true) {
      global_goal = false;

      Q.clearStages();
      global_current_level += 1
      Q.stageScene("level" + global_current_level);
      //console.log("level" + global_current_level, "level" + global_current_level === "level2");
      Q.stageScene('hud', 3, Q('PlayerStrip').first().p);
  }
  }
});


Q.Collectable.extend("Rice", {
  // When a Rice is hit.
  sensor: function(colObj) {
    // Increment the rice count.
      //console.log(colObj.p.rice_count);
      colObj.p.rice_count = Math.max(1, colObj.p.rice_count+1);
      global_rice_count += 1;
      //Q.stageScene('hud', 3, colObj.p);
    this.destroy();
  },
  step: function(dt) {
    this.play("play");
  }
});

Q.Collectable.extend("Seaweed", {
  // When a Seaweed is hit.
  sensor: function(colObj) {
    // Increment the seaweed count.
      colObj.p.seaweed_count = Math.max(colObj.p.seaweed_count + 1, 1);
      global_seaweed_count += 1;
      //Q.stageScene('hud', 3, colObj.p);
    this.destroy();
  }
});

Q.Collectable.extend("Sushi", {
  // When a Fish is hit.
  init: function(p) {
    this._super(p, {
      name:"red_fish",
      sheet:"fish",
      sprite:"red_fish",
    });
  },
  sensor: function(colObj) {
    //console.log("hi");
    colObj.p.sushi_list.push(this.p.name);
    global_sushi_count += 1;
    //console.log(colObj.p.sushi_list);
    //Q.stageScene('hud', 3, colObj.p);
    this.destroy();
  },

});


Q.Sprite.extend("Sushi_Indicator", {
  init: function(p) {
    this._super(p, {
      sheet:"sushistatusindicator",
      frame:0,
      scale:0.7,
    });

  },
  step: function(dt) {
    if (global_rice_count > 0 && global_seaweed_count <= 0 && global_sushi_count > 0) {
      this.p.frame = 1;
    } else if (global_rice_count > 0 && global_seaweed_count <= 0 && global_sushi_count <= 0) {
      this.p.frame = 2;
    } else if (global_rice_count > 0 && global_seaweed_count > 0 && global_sushi_count <= 0) {
      this.p.frame = 3;
    } else if (global_rice_count <= 0 && global_seaweed_count <=0 && global_sushi_count > 0) {
      this.p.frame = 4;
    } else if (global_rice_count <= 0 && global_seaweed_count >0 && global_sushi_count > 0) {
      this.p.frame = 5;
    } else if (global_sushi_count <=0 && global_seaweed_count >0 && global_sushi_count <= 0) {
      this.p.frame = 6;
    }
  }
});


Q.scene("level1",function(stage) {
  Q.stageTMX("level1.tmx",stage);

  stage.add("viewport").follow(Q("PlayerStrip").first());
});

Q.scene("level2",function(stage) {
  Q.stageTMX("level2.tmx",stage);

  stage.add("viewport").follow(Q("PlayerStrip").first());
});


Q.scene('hud',function(stage) {
  var container = stage.insert(new Q.UI.Container({
    x: 170, y: 20
  }));


  var sushiObtained = container.insert(new Q.UI.Text({x:200, y:20,
    label: "Number of Sushi obtained: " + global_sushi_obtained_count, color:"#ebe4e8", size:50, fontFamily:"Oswald"}))

  var rice_indicator = stage.insert(new Q.Sushi_Indicator({x:Q.width - 100, y:40}));
  //var seaweed_indicator = stage.insert(new Q.Seaweed_Indicator);
  //var sushi_indicator = stage.insert(new Q.Sushi_Indicator);

  container.fit(20);
});

Q.loadTMX("level1.tmx, level2.tmx, sushistatusindicator.png, sushistatusindicator.json, playerstrip.png, playerstrip.json, fishstrip.png, fish.json, rice.json, ricestrip.png, seaweed.png, monster1strip.png, monster2strip.png, monster1.json, monster2.json, seaweed.json, collectables.json, doors.json, enemies.json, fire.mp3, jump.mp3, heart.mp3, hit.mp3, coin.mp3", function() {
    Q.compileSheets("playerstrip.png", "playerstrip.json");
    Q.compileSheets("collectables.png","collectables.json");
    Q.compileSheets("monster1strip.png", "monster1.json");
    Q.compileSheets("monster2strip.png", "monster2.json");
    Q.compileSheets("sushistatusindicator.png", "sushistatusindicator.json");
    Q.compileSheets("enemies.png","enemies.json");
    Q.compileSheets("doors.png","doors.json");
    Q.compileSheets("ricestrip.png", "rice.json");
    Q.compileSheets("fishstrip.png", "fish.json");
    Q.compileSheets("seaweed.png", "seaweed.json");
    Q.animations("rice", {
      play: {
        frames: [0,1], rate: 1/2, loop: true
      }
    });
    Q.animations("playerstrip", {
      walk_right: { frames: [4,5,6], rate: 1/6, flip: false, loop: true },
      walk_left: { frames:  [4,5,6], rate: 1/6, flip:"x", loop: true },
      jump_right: { frames: [7,8,9], rate: 1/3, flip: false, loop: false },
      jump_left: { frames:  [7,8,9], rate: 1/3, flip: "x", loop:false },
      stand_right: { frames:[3], rate: 1/10, flip: false },
      stand_left: { frames: [3], rate: 1/10, flip:"x" },
      duck_right: { frames: [3], rate: 1/10, flip: false },
      duck_left: { frames:  [3], rate: 1/10, flip: "x" },
      climb: { frames:  [0], rate: 1/3, flip: false }
    });
    var EnemyAnimations = {
      walk: { frames: [0,1], rate: 1/3, loop: true },
      dead: { frames: [2], rate: 1/10 }
    };
    Q.animations("monster1", EnemyAnimations);
    Q.animations("monster2", EnemyAnimations);    
    Q.animations("fly", EnemyAnimations);
    Q.animations("slime", EnemyAnimations);


    Q.animations("snail", EnemyAnimations);
    if (global_current_level == 1) {
      Q.stageScene("level1");
    }
    if (global_current_level == 2) {
      Q.stageScene("level");
    }
    Q.stageScene('hud', 3, Q('PlayerStrip').first().p);
  
}, {
  progressCallback: function(loaded,total) {
    var element = document.getElementById("loading_progress");
    element.style.width = Math.floor(loaded/total*100) + "%";
    if (loaded == total) {
      document.getElementById("loading").remove();
    }
  }
});


});
