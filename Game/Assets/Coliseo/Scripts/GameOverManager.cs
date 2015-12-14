// ------------------------------------------------------------------------------
//  <autogenerated>
//      This code was generated by a tool.
//      Mono Runtime Version: 4.0.30319.1
// 
//      Changes to this file may cause incorrect behavior and will be lost if 
//      the code is regenerated.
//  </autogenerated>
// ------------------------------------------------------------------------------
using UnityEngine;
using Coliseo;
using System.Xml;
using System.IO;
using System.Xml.Serialization;
using System.Collections;
using System.Collections.Generic;

namespace Coliseo{

	public class GameOverManager : MonoBehaviour
	{
		public static GameOverManager manager;
		public float restartDelay = 5f;         // Time to wait before restarting the level
		
		
		Animator anim;                          // Reference to the animator component.
		float restartTimer;                     // Timer to count up to restarting the level
		bool restart = false;
		
		
		void Awake ()
		{
			// Set up the reference.
			anim = GetComponent <Animator> ();
			manager = this;
		}

		public void Update() {
			if (restart) {
				// .. increment a timer to count up to restarting.
				restartTimer += Time.deltaTime;
				// .. if it reaches the restart delay...
				if (restartTimer >= restartDelay) {
					// .. then reload the currently loaded level.
					Debug.Log ("Loading Level");
					restart = false;
					Application.LoadLevel (Application.loadedLevel);
				}
			}
		}
		
		
		public void Gameover ()
		{
			// If the player has run out of health...
			anim.SetTrigger ("GameOver");

			string username = Player.username;
			string auth = username + ":" + Player.password;
			WWWForm scoreForm = new WWWForm ();
			scoreForm.AddField ("score", ScoreManager.score);
			var headers = scoreForm.headers;
			headers ["Authorization"] = "Basic " + System.Convert.ToBase64String (System.Text.Encoding.ASCII.GetBytes (auth));
			WWW w = new WWW ("http://localhost:3000/api/v1/scores/" + username, scoreForm.data, headers);
			while (!w.isDone) { };

			XmlSerializer ser = new XmlSerializer (typeof(LevelManager.ScoresAroundList));
			LevelManager.ScoresAroundList s = new LevelManager.ScoresAroundList();
			using (TextReader r = new StringReader(w.text))
			{
				s = (LevelManager.ScoresAroundList)ser.Deserialize(r);
			}
			//HighScoreText.text = "";
			int rank = 1;
			foreach (LevelManager.ScoreItem score in s.Items)
			{
				string scoreStr = score.score + "";
				//HighScoreText.text += string.Format("t{1}\t\t{2}\n", score.username, scoreStr);
			}

			Debug.Log ("Submiting score for " + Player.username + " with pass " + Player.password);
			//Application.LoadLevel ("StartMenu");
				
			restart = true;
		}
	}
}