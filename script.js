document.addEventListener('DOMContentLoaded', () => {
    const assignButton = document.getElementById('assign-button');
    const teamsContainer = document.getElementById('teams-container');

    
    const predefinedTeams = {
        A: { leader: '샘플이름1', members: ['샘플이름2', '샘플이름3', '샘플이름4', '샘플이름5', '샘플이름6', '샘플이름7', '샘플이름8'] },
        B: { leader: '샘플이름9', members: ['샘플이름10', '샘플이름11', '샘플이름12', '샘플이름13', '샘플이름14', '샘플이름15', '샘플이름16'] },
        C: { leader: '샘플이름17', members: ['샘플이름18', '샘플이름19', '샘플이름20', '샘플이름21', '샘플이름22', '샘플이름23', '샘플이름24'] },
        D: { leader: '샘플이름25', members: ['샘플이름26', '샘플이름27', '샘플이름28', '샘플이름29', '샘플이름30', '샘플이름31', '샘플이름32'] }
    };

    // 전체 학생 명단 추출 (랜덤 이펙트용)
    const allStudents = Object.values(predefinedTeams).flatMap(team => [team.leader, ...team.members]);

    // 몇 번째 실행에 '고정 명단'을 보여줄지 설정 (팀 내에서만 순서 섞기)
    const fixedRunToShow = 3; 
    let runCount = 0;

    assignButton.addEventListener('click', startAssignment);

    function startAssignment() {
        assignButton.disabled = true;
        assignButton.textContent = '팀 배정 중... 🎲';

        runCount++;

        let teamsToDisplay;

        // [수정] 설정된 횟수와 현재 횟수가 일치하는지에 따라 다른 랜덤 로직을 적용
        if (runCount === fixedRunToShow) {
            // "고정 명단" 모드: 팀은 유지하되, 팀원 순서만 랜덤으로 섞음
            teamsToDisplay = shuffleMembersWithinTeams(); 
        } else {
            // "변동 명단" 모드: 조장은 고정, 나머지 팀원들은 모든 팀에 걸쳐 완전히 새로 배정
            teamsToDisplay = generateCrossTeamShuffle();
        }
        
        prepareTeamSlots(teamsToDisplay);
        revealTeamsSequentially(teamsToDisplay);
    }
    
    // [수정] "고정 명단" 생성 함수 (팀 내에서만 조원 순서 섞기)
    function shuffleMembersWithinTeams() {
        const newTeams = JSON.parse(JSON.stringify(predefinedTeams));
        for (const teamKey in newTeams) {
            shuffleArray(newTeams[teamKey].members);
        }
        return newTeams;
    }

    // [추가] "변동 명단" 생성 함수 (조장 제외 모든 조원을 섞어 팀 재배정)
    function generateCrossTeamShuffle() {
        // 1. 조장을 제외한 모든 조원들을 하나의 배열로 모음
        const allMembers = Object.values(predefinedTeams).flatMap(team => team.members);
        shuffleArray(allMembers); // 이 배열을 랜덤으로 섞음

        // 2. 조장만 있는 새로운 팀 구조를 만듬
        const newTeams = {};
        const teamKeys = Object.keys(predefinedTeams);
        teamKeys.forEach(key => {
            newTeams[key] = {
                leader: predefinedTeams[key].leader,
                members: [] // 조원 목록은 비워둠
            };
        });

        // 3. 섞인 조원들을 각 팀에 순서대로 배분
        allMembers.forEach((member, index) => {
            const teamKey = teamKeys[index % teamKeys.length];
            newTeams[teamKey].members.push(member);
        });

        return newTeams;
    }

    // 배열을 랜덤으로 섞는 유틸리티 함수
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function prepareTeamSlots(teams) {
        Object.keys(teams).forEach(teamKey => {
            const teamList = teamsContainer.querySelector(`#team-${teamKey} .member-list`);
            teamList.innerHTML = '';

            const memberCount = (teams[teamKey].leader ? 1 : 0) + teams[teamKey].members.length;
            
            for (let i = 0; i < memberCount; i++) {
                const li = document.createElement('li');
                li.innerHTML = `<span class="name shuffling-effect">???</span>`;
                teamList.appendChild(li);
            }
        });
    }

    async function revealTeamsSequentially(teams) {
        const teamKeys = Object.keys(teams);
        const maxMembers = Math.max(...teamKeys.map(key => (teams[key].leader ? 1 : 0) + teams[key].members.length));

        for (let i = 0; i < maxMembers; i++) {
            for (const teamKey of teamKeys) {
                const teamData = teams[teamKey];
                const teamCard = document.getElementById(`team-${teamKey}`);
                const listItems = teamCard.querySelectorAll('.member-list li');
                
                if (i < (teamData.leader ? 1 : 0) + teamData.members.length) {
                    const li = listItems[i];
                    const nameSpan = li.querySelector('.name');
                    
                    teamCard.classList.add('active-glow');
                    teamCard.style.setProperty('--glow-color', `var(--team-${teamKey.toLowerCase()}-color)`);
                    
                    const shuffleInterval = setInterval(() => {
                        const randomName = allStudents[Math.floor(Math.random() * allStudents.length)];
                        nameSpan.textContent = randomName;
                    }, 50);

                    await sleep(1000); // 공개 주기 5초 유지 (1초 딜레이)
                    clearInterval(shuffleInterval);

                    const isLeader = i === 0 && teamData.leader;
                    const name = isLeader ? teamData.leader : teamData.members[i - 1];
                    
                    nameSpan.textContent = name;
                    nameSpan.classList.remove('shuffling-effect');
                    li.classList.add('reveal-animation');

                    if (isLeader) {
                        const leaderTag = document.createElement('span');
                        leaderTag.className = 'leader-tag';
                        leaderTag.textContent = '조장';
                        li.appendChild(leaderTag);
                    }
                    
                    await sleep(250); // 다음 팀 공개 전 0.25초 딜레이
                    teamCard.classList.remove('active-glow');
                }
            }
        }
        
        assignButton.disabled = false;
        assignButton.textContent = '다시 뽑기 🚀';
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
});