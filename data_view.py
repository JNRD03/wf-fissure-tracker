#run this to view api data in an organized way

import requests

def fetch_fissures():
    url = "https://api.warframestat.us/pc/fissures"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        all_fissures = response.json()

        normal_fissures = [f for f in all_fissures if not f.get('isHard') and not f.get('isStorm')]
        steel_path_fissures = [f for f in all_fissures if f.get('isHard') and not f.get('isStorm')]

        def print_table(title, data_list):
            if not data_list:
                return
                
            print(f"\n=== {title.upper()} ===")
            print(f"{'TIER':<10} | {'MISSION TYPE':<15} | {'NODE':<25} | {'TIME LEFT'}")
            print("-" * 75)
            
            data_list.sort(key=lambda x: x.get('tierNum', 0))
            
            for f in data_list:
                tier = f.get('tier', 'N/A')
                mission = f.get('missionType', 'N/A')
                node = f.get('node', 'N/A')
                eta = f.get('eta', 'N/A')
                
                print(f"{tier:<10} | {mission:<15} | {node:<25} | {eta}")

        print_table("Normal Fissures (Ground)", normal_fissures)
        print_table("Steel Path Fissures (Ground)", steel_path_fissures)

    except Exception as e:
        print(f"Error fetching data: {e}")

if __name__ == "__main__":

    fetch_fissures()
