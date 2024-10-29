<?php
/*
  Plugin Name: Audioburst Podcast Highlights Player
  Description: Plays of Audioburst playlists and stories
  Contributors: gal@audioburst.com , zeev.belkin@gmail.com
  Author: Audioburst
  Version: 1.22.1
  Requires at least: 5.4.1
  Tested up to:  5.6.1
  Requires PHP: 5.3.0
  Author URI: https://www.audioburst.com/
  License: GPLv2 or later
  License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */
 
 
class AudioburstPlayerWidget extends \WP_Widget {
	public function __construct() {
        parent::__construct(
                'audioburst_player_widget', // Base ID
                'Audioburst Podcast Highlights Player', // Name
                array('description' => 'Plays Audioburst Feeds') // Args
        );
        add_action('vc_before_init', array($this, 'visual_composer'), 9);			 
    }
	
	function widget($args, $instance) {
	    extract($args);
		echo $before_widget;
  	    echo $before_title /*. $title*/ . $after_title;

        $playlist = self::playlistName($instance);
        $autoplay = self::autoplayFlag($instance);
        $cmPlayAllBursts = self::cmPlayAllBursts($instance);
        $cmSameSource = self::cmSameSource($instance);
        $viewMode = self::viewMode($instance);
        $theme = self::theme($instance);
        $selectedVmAttrs= self::$viewModes[$viewMode];

        if (array_key_exists('themes', $selectedVmAttrs)) $themes = $selectedVmAttrs['themes'];

        $creatorMode = self::creatorMode( $instance);
        $stationId = self::stationId($instance); 
        $cmBurstId = self::cmBurstId($instance);

        $burstId='';

        $sbm = $creatorMode ?!$cmPlayAllBursts: false;

		if ($creatorMode) {
			if ($sbm) {
				$action = $cmSameSource ? 'same_source' : 'related_bursts';
				$value = $cmBurstId;
			} else {
				$action = "s_playlist";
				$value = $stationId;
			}
		} else {
			$action = $sbm ? 'related_bursts' : 'channel';
			$value = $sbm ? $burstId : $playlist;
		}

		?>
		<iframe style="width:600px;min-width:600px;height:300px;overflow:hidden;" width="600px" height="200px" 
           scrolling="no" frameborder="no"
           src="https://embed.audioburst.com/?source=audioburst<?php 
               echo "&autoplay=".($autoplay?'true':'false');
               echo "&action=".$action;
               echo "&mode=".$viewMode;
               echo "&value=".esc_attr($value);
                  $t=$instance['theme'];
              if ($t) {
                echo '&theme='.$t;
              }
           ?>"
           allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"></iframe>
        <?php
        echo $after_widget;
	}

    function update($new_instance, $old_instance) {		
		$instance = $old_instance;
        $instance['creatorMode'] = strip_tags($new_instance['creatorMode']);

        $instance['cmPlayAllBursts'] = strip_tags($new_instance['cmPlayAllBursts']);
        $instance['cmSameSource'] = strip_tags($new_instance['cmSameSource']);
        $instance['stationId'] = strip_tags($new_instance['stationId']);
        $instance['cmBurstId'] = strip_tags($new_instance['cmBurstId']);

		$instance['playlist'] = strip_tags($new_instance['playlist']);
        $instance['autoplay'] = strip_tags($new_instance['autoplay']);
        $vm=$new_instance['viewMode'];
        $instance['viewMode'] = strip_tags($vm);
        $instance['theme'] = strip_tags($new_instance['theme']);
        $themes=self:: $viewModes[$vm];
        if (!$themes)  $instance['theme'] = null;
        return $instance;
    }

    static function stationId($instance) {
        $sid=19251;
        if (array_key_exists('stationId', $instance)) {
           $v=$instance['stationId'];
           return is_numeric($v)?$v:''; 
        }
        return $sid;
    }

    static function playlistName($instance) {
       return  array_key_exists('playlist', $instance)
            ? $instance['playlist']
            : 1;      
            // {"DisplayName":"Top Stories", "playlistId":"1"}
    }

    static $viewModes=[
       "2b" => ["label" => "2 Buttons Player"],
	   "it" => ["label" => "iTunes Player"],
	   "2s" => ["label" => "2 State Player"],
	   "ab2" => ["label" => "ab2 Player", "themes" => ["light", "dark"]],
	   "ab1" => ["label" => "ab1 Player", "themes" => ["dark", "light"]],
	   "ls" => ["label" => "L Shape Player" ],
       'maxi'=> ['label'=>'Maxi', 'themes' => ["light", "dark"]],
       'midi'=> ['label'=>'Midi', 'themes' => ["light", "dark"]],
       'mini'=> ['label'=>'Mini', 'themes' => ["light", "dark"]]
    ];

    static function creatorMode( $instance) {
       return  array_key_exists('creatorMode', $instance)
            ?$instance['creatorMode']=='true'
            :false ;
    }

    static function viewMode( $instance) {
       return  array_key_exists('viewMode', $instance)
            ? $instance['viewMode']
            :'maxi' ;
    }

    static function cmBurstId($instance) {
        return  array_key_exists('cmBurstId', $instance)
            ? $instance['cmBurstId']
            : null ;   
    }

    static function theme( $instance) {
       return  array_key_exists('theme', $instance)
            ? $instance['theme']
            : '' ;
    }

    function autoplayFlag($instance) {
       return  array_key_exists('autoplay', $instance)
            ? (
                strpos($instance['autoplay'], 'on')  !== false
            )
            :false ;
    }

    function cmPlayAllBursts($instance) {
       return  array_key_exists('cmPlayAllBursts', $instance)
            ? (
                strpos($instance['cmPlayAllBursts'], 'on')  !== false
            )
            :false ;
    }

    function cmSameSource($instance) {
       return  array_key_exists('cmSameSource', $instance)
            ? (
                strpos($instance['cmSameSource'], 'on')  !== false
            )
            :false ;
    }

    const PLAYLISTS_HOME='https://sapi.audioburst.com/static/api/mobileHomeSettings_V07/json';
    const MODES_LIST='https://sapi.audioburst.com/Embeddable/get?appKey=WPPlugin';

    public function form( $instance ) {
       $wpgetArgs=[
          'timeout'=>300,
          'sslverify' => false
       ];

       $plJson=get_transient(self::PLAYLISTS_HOME);
       if (!$plJson) {
           $plText=wp_remote_retrieve_body(
               wp_remote_get(
                self::PLAYLISTS_HOME,  $wpgetArgs
               )
           );
           $plJson = json_decode(
             // headers: date, expires
             $plText
           );
           if ($plJson) set_transient(self::PLAYLISTS_HOME, $plJson, 1200);
       }

       $modesJson=get_transient(self::MODES_LIST);
       if (!$modesJson) {
           $modesText=wp_remote_retrieve_body(
               wp_remote_get(
                 self::MODES_LIST, $wpgetArgs
               )
           );
           $modesJson = json_decode(
             // headers: date, expires
              $modesText
           );
           if ($modesJson) set_transient(self::MODES_LIST, $modesJson, 1200);
       }

       foreach ($modesJson as $mode) if ($mode->Active&&$mode->IntegrationType=='js') {
         if (array_key_exists($mode->Key, self::$viewModes)) {
            self::$viewModes[$mode->Key]['label']=$mode->Description;
            self::$viewModes[$mode->Key]['themes']= $mode->Themes;
         } else {
            self::$viewModes[$mode->Key]=[
              'label' => $mode->Description,
              'themes' => $mode->Themes
            ];
         }  
       }
        
       $playlist = self::playlistName($instance);
       $autoplay = self::autoplayFlag($instance);
       $cmPlayAllBursts = self::cmPlayAllBursts($instance);
       $cmSameSource = self::cmSameSource($instance);
       $viewMode = self::viewMode($instance);
       $theme = self::theme($instance);
       $themes = self::$viewModes[$viewMode]['themes'];
       $creatorMode = self::creatorMode( $instance);
       $stationId = self::stationId($instance); 
       $cmBurstId = self::cmBurstId($instance);

       $creatorModeSelectorId=uniqid();
       $creatorModeSectionId=uniqid();
       $byTopicModeSectionId=uniqid();
       $cmStorySelectionHolderId=uniqid();
       $stationLst = null;

       if ($creatorMode&&is_numeric($stationId)) {
          $stationUrl='https://sapi.audioburst.com/v2/topstories/search?q=*&top=25&device=web&appKey=CrowdTask&filter=stationId+eq+'.$stationId;
          $stationLst=get_transient($stationUrl);
          if (!$stationLst) {
              $stationText=wp_remote_retrieve_body(
                   wp_remote_get(
                     $stationUrl, $wpgetArgs
                   )
              );
              $stationJson = json_decode(
                 $stationText
              );
              if ($stationJson) {
                  if (array_key_exists('bursts',$stationJson)&&$stationJson->bursts) {
                      $stationLst=[
				         [ 'value' => null, 'label' => 'Choose a story ...']
			          ];
                      foreach ($stationJson->bursts as $burst) {
                        array_push(
                          $stationLst,
                          [
                            'label' => $burst->title,
                            'value' => $burst->burstId
                          ]
                        );
					 }
                     set_transient($stationUrl, $stationLst, 1200);
                 }
              }
         }  
       }

        ?>
        <p>
          <div id="<?php echo $creatorModeSelectorId;?>"></div>
          <input type="hidden"
               value="<?php echo $creatorMode?'true':'false';?>"
               id="<?php echo $this->get_field_id('creatorMode'); ?>"
               name="<?php echo $this->get_field_name('creatorMode'); ?>"
          />
          <div id="<?php echo  $byTopicModeSectionId?>"
             style="display:<?php echo $creatorMode?'none':'block'; ?>;"
          >
          <label for="<?php echo $this->get_field_id('playlist'); ?>">Choose a topic</label> 
          <select class="widefat" id="<?php echo $this->get_field_id('playlist'); ?>"
              name="<?php echo $this->get_field_name('playlist'); ?>"
          >
          <?php
            foreach ($plJson->sections as $sec) {
               if (($sec->title != 'My Feed')&&
                   ($sec->title != 'My Playlists')&&
                   ($sec->index > 1) &&
                   ( count($sec->items) > 0
                     && (count($sec->items)  > 1 || $sec->items[0]->name != 'For You')
                   )
               ) {
                  foreach ($sec->items as $item) {
                    ?><option value='<?php
                        $echoItemId=function() use ($item, $sec) {
                            $v = $item->name;
                            $pid=$item->playlistId;
                            if (isset($pid) && is_numeric($pid)) {
                               $dup = false;
                               foreach ($sec->items as $pl) if ($pid == $pl->playlistId && $pl != $item) {
								  $dup = true; break;
							   } 
                               if (!$dup)  $v=$pid;
                            }
                            echo esc_attr($v); 
                        };
                        $echoItemId();
                    ?>'
                     <?php  if ($item->name==$playlist||$item->playlistId==$playlist)  echo 'selected' ?>
                    ><?php echo htmlspecialchars($item->DisplayName); ?></option><?php
                  }
               }  
            }
          ?>
          </select>
          </div> <!--  $byTopicModeSectionId -->
          <div id="<?php echo $creatorModeSectionId; ?>"
               style="display:<?php echo $creatorMode?'block':'none';?>"
          ><br>
            <label for="<?php echo $this->get_field_id('stationId'); ?>">Station ID (
                <a href="https://creators.audioburst.com/?utm_source=WP&utm_medium=plugin&utm_campaign=plugin"
                    target="_blank" >grab your own content</a>)
            </label>
            <input
                type="text" 
                id="<?php echo $this->get_field_id('stationId'); ?>"
                name="<?php echo $this->get_field_name('stationId'); ?>"
                value="<?php echo $stationId; ?>"
             />
            <p/>
            <div>
                <input type="checkbox" 
                id="<?php echo $this->get_field_id('cmPlayAllBursts'); ?>"
                name="<?php echo $this->get_field_name('cmPlayAllBursts'); ?>"
                <?php if ($cmPlayAllBursts) echo "checked"; ?>
                />
                <label for="<?php echo $this->get_field_id('cmPlayAllBursts'); ?>">Play all</label> 
            </div>
            <div id="<?php echo $cmStorySelectionHolderId; ?>" style="display:<?php echo $cmPlayAllBursts?'none':'block'; ?>">
                <br>
                <!--?php  var_dump($stationLst); ?-->
                <label for="<?php echo $this->get_field_id('cmBurstId'); ?>">Choose a story</label>
                <select class="widefat" id="<?php echo $this->get_field_id('cmBurstId'); ?>"
                  <?php echo 'name="'.$this->get_field_name('cmBurstId').'"'; 
                  /*
                        if (is_numeric(cmBurstId)) { 
                            echo 'value="'.$cmBurstId.'"'; 
                        }*/
                  ?>
                >
                  <?php 
                     if ($stationLst) {
                         foreach ($stationLst as $b) {
                           ?>
                           <option
                             value="<?php 
                                if ($b['value']) echo esc_attr($b['value']); 
                             ?>"
                             <?php
                                if ($b['value']==$cmBurstId) echo " selected";
                             ?>
                           >
                           <?php echo htmlspecialchars($b['label']); ?></option> 
                           <?php
                         }
                     }
                  ?>
                </select>
                 <div>
                    <br>
                    <input type="checkbox" 
                    id="<?php echo $this->get_field_id('cmSameSource'); ?>"
                    name="<?php echo $this->get_field_name('cmSameSource'); ?>"
                    <?php if ($cmSameSource) echo "checked"; ?>
                    />
                    <label for="<?php echo $this->get_field_id('cmSameSource'); ?>">Next bursts from the same show</label> 
                </div>
            </div>

          </div> <!-- $creatorModeSectionId -->
          <br>
          <!-- viewMode { -->
          <label for="<?php echo $this->get_field_id('viewMode'); ?>">Look and Feel</label>
          <select class="widefat" id="<?php echo $this->get_field_id('viewMode'); ?>"
              name="<?php echo $this->get_field_name('viewMode'); ?>"
          >
           <?php
                foreach ( self::$viewModes as $val => $rec ) {
                    ?><option value='<?php echo esc_attr($val); ?>'
                        <?php  if ($val==$viewMode)  echo 'selected' ?>
                    ><?php echo $rec['label']; ?></option><?php     
			    }

                $themeSelectorVisibility='display:'.($themes?'':'none');
            ?>
          </select>
          <br/>
          <!-- } viewMode -->
          <!-- theme { -->
          <div>
          <label for="<?php echo $this->get_field_id('theme'); ?>" style="<?php echo $themeSelectorVisibility; ?>">Theme</label>
          <select class="widefat" id="<?php echo $this->get_field_id('theme'); ?>"
              name="<?php echo $this->get_field_name('theme'); ?>"
              style="<?php echo $themeSelectorVisibility; ?>"
          >
           <?php
                if ($themes) foreach ($themes as $t ) {
                    ?><option value='<?php echo esc_attr($t); ?>'
                        <?php  if ($t==$theme)  echo 'selected' ?>
                    ><?php echo $t; ?></option><?php     
			    }
            ?>
          </select>
          </div>
          <script type="text/javascript">
           with (window.Audioburst.commons) (function() {
                $(document).ready(function() {
                    let creatorModeSelectorId="<?php echo $creatorModeSelectorId;?>";
                    let stationIdSelector=$("#<?php echo $this->get_field_id('stationId'); ?>");
                    let cmPlayAllBurstsSelector=$("#<?php echo $this->get_field_id('cmPlayAllBursts'); ?>");
                    let cmStorySelectionHolder=$("#<?php echo $cmStorySelectionHolderId; ?>");
                    let creatorModeHolder=$("#<?php echo $this->get_field_id('creatorMode'); ?>");
                    let creatorModeSection=$("#<?php echo $creatorModeSectionId; ?>");
                    let byTopicModeSection=$("#<?php echo $byTopicModeSectionId; ?>");
                    let cmBurstSelector=$("#<?php echo $this->get_field_id('cmBurstId'); ?>");
                    let cmSameSourceSelector=$("#<?php echo $this->get_field_id('cmSameSource'); ?>");

                    let viewModes=<?php echo json_encode(self::$viewModes); ?>; 
                    let theme="<?php echo $theme;?>";


                    let viewModeSelect=$('#<?php echo $this->get_field_id('viewMode');?>');
                    let themeSelect=$('#<?php echo $this->get_field_id('theme');?>');
                    let themeSelectLabel = $("label[for='" + (themeSelect.attr('id')) + "']");
                    let creatorMode=<?php echo $creatorMode?'true':'false'; ?>;
                    let cmPlayAllBursts=<?php echo $cmPlayAllBursts?'true':'false'; ?>;
                    let cmSameSource=<?php echo $cmSameSource?'true':'false'; ?>;
                    let stationId=<?php echo is_numeric($stationId)?$stationId:'undefined'; ?>;
                    let cmBurstId='<?php echo $cmBurstId; ?>';


                    function adjustCmPlayAllBurstsSelectorVisibility() {
                       let c=cmPlayAllBurstsSelector.is(':checked');
                       clog("cmBurstSelector.find('option')=", cmBurstSelector.find('option').length);
                       if (!cmBurstSelector.find('option').length) c=true;
                       cmStorySelectionHolder.css('display',c?'none':'block');   
                    }


                    cmPlayAllBurstsSelector.change(adjustCmPlayAllBurstsSelectorVisibility);  


                    function fillBurstSelector() {
                        if (creatorMode&&isDefined(stationId)) {  
                            function empty() {
                                cmBurstSelector.find('option').remove();
                            }
                            if (stationId) {
                                clog('fillBurstSelector.stationId=',stationId);
                                fetchBurstsByStationId(
                                    stationId,
                                    (lst)=>{
                                        empty();
                                        if (!isEmpty(lst)) {
                                            for (let b of lst) {
                                                let opt=$('<option>').val(b.value?b.value:'').text(b.label);
                                                if (b.value==cmBurstId) {
                                                   opt.attr('selected','selected');
                                                   cmBurstSelector.val(cmBurstId?cmBurstId:'');
                                                }
                                                cmBurstSelector.append(opt);
                                            }
                                        }
                                        adjustCmPlayAllBurstsSelectorVisibility();
                                    }
                                );
                            } else {
                                empty(); 
                                adjustCmPlayAllBurstsSelectorVisibility();
                            } 
                        }
                    }


                    stationIdSelector.on("input keydown keyup mousedown mouseup select contextmenu drop", function() {
                    	let newValue =  xSafe(()=>this.value.trim(),'');
                        let ovDefined = this.hasOwnProperty("oldValue");
						if (newValue=='' || isIntString(newValue)) {
                           if (newValue!=''&&newValue!=stationId) {
                              stationId = newValue;
                              this.oldValue = newValue ;
                              stationIdSelector.val(newValue);
                              fillBurstSelector();
                           }
						} else if (ovDefined) {
                           this.value = this.oldValue;
                        }
                    });

                    class TS extends AudioburstToggleSwitcher {
                       constructor(props) {
			              super(props);
                          this.state={
                            checked: !creatorMode
                          };
                       }

                       render() {
                         return el(
                            AudioburstToggleSwitcher, {
                                checked: this.state.checked,
                                onChange: () => {
                                    let v=!this.state.checked;
                                    this.setState({checked: v});
                                    creatorModeHolder.val( creatorMode=!v );
                                    byTopicModeSection.css('display', v?'block':'none');
                                    creatorModeSection.css('display', v?'none':'block');
                                    if (creatorMode) fillBurstSelector();
                                }
                            }
                         );
                       }
                    }

                    element.render(
                         el(
					        wp.components.BaseControl,
					        {},
					        el('label', {
						        className: "components-toggle-control__label",
						        style: {
							        "padding-right": '10px'
						        }
					        }, "By show"),
                            el(TS),
					        el('label', {
						        className: "components-toggle-control__label",
						        style: {
							        "padding-left": '10px'
                                }
						      },
                              "By topic"
                            )
                        ),
                        document.getElementById(creatorModeSelectorId)
                    );
                
                    function regenerateThemesSelector() {
                        let mode=viewModeSelect.val(), themes=viewModes[mode]['themes'];
                    
                        if (!isEmpty(themes)) {
                           themeSelect.css('display','');
                           themeSelectLabel.css('display','');
                           themeSelect.find('option').remove();
                           for (let t of themes) {
                              let opt=$('<option>').val(t).text(t);
                              if (t==theme) opt.attr('selected','selected');
                              themeSelect.append(opt);
                           }
                        } else {
                           themeSelect.css('display','none');
                           themeSelectLabel.css('display','none');
                        }
                    }

                    viewModeSelect.change(regenerateThemesSelector);
                }
              );
             } 
            )();    
          </script>
          <!-- } theme -->
          <br>
          <input type="checkbox" 
            id="<?php echo $this->get_field_id('autoplay'); ?>"
            name="<?php echo $this->get_field_name('autoplay'); ?>"
            <?php if ($autoplay) echo "checked"; ?>
          />
          <label for="<?php echo $this->get_field_id('autoplay'); ?>">Enable automatic play</label> 
        <?php 
    }
	
};	

add_action(
  'widgets_init', 
  function() {
     register_widget('AudioburstPlayerWidget');
  }
);

add_action(
    'admin_enqueue_scripts',
    function($hook) { 
        if ($hook == 'widgets.php') { 
           wp_enqueue_script('wp-element');
           wp_enqueue_script('wp-components');
           wp_enqueue_script('wp-compose');
           wp_enqueue_script('wp-util');
           wp_enqueue_script('audioburst-commons');
       
           wp_enqueue_style('wp-block-editor');
        }
    }
);

add_action(
  'init', 
  function() {
	if (function_exists('register_block_type')) {
        wp_register_script(
			'audioburst_ext_rc_components',
			plugins_url( 'p/ext_rc_components.js', __FILE__ ),
			array(),
			filemtime( plugin_dir_path( __FILE__ ) . 'p/ext_rc_components.js' )
		);
        
      	wp_register_script(
			'audioburst-commons',
			plugins_url( 'audioburst-commons.js', __FILE__ ),
			array( 'wp-element', 'wp-components', 'wp-util'),
			filemtime( plugin_dir_path( __FILE__ ) . 'audioburst-commons.js' )
		);

		wp_register_script(
			'audioburst_block_script',
			plugins_url( 'regblock.js', __FILE__ ),
			array( 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-editor', 
             'wp-util', 'audioburst_ext_rc_components', 'audioburst-commons', 'wp-components'),
			filemtime( plugin_dir_path( __FILE__ ) . 'regblock.js' )
		);

        
        wp_register_style(
            'audioburst_montserrat',
            'https://fonts.googleapis.com/css?family=Montserrat:400,500,600&display=swap'
        );

        wp_register_style(
            'audioburst_block_style',
            plugins_url( 'regblock.css', __FILE__ ),
            array( 'wp-edit-blocks','audioburst_montserrat'),
            filemtime( plugin_dir_path( __FILE__ ) . 'regblock.css' )
        );
   
		register_block_type( 'audoburst/player', array(
			'editor_script' => 'audioburst_block_script',
            'editor_style' => 'audioburst_block_style'
		)); 
	}
  }
);

